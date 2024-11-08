import { Injectable } from '@angular/core';
import { Observable, Observer, ReplaySubject, Subject } from 'rxjs';
import { take, filter } from 'rxjs/operators';

const VERSION = 1;
interface Record {
    key: string;
    value: any;
    ttl: number;
    timestamp: number;
}
type RecordInput = Omit<Record, 'timestamp'>;
@Injectable({
    providedIn: 'root',
})
export class IndexedDbService {
    db = new ReplaySubject<IDBDatabase | null>(1);
    $db = this.db.pipe(take(1), filter(db => !!db));

    constructor() {
        const onError = (error:any) => {
            console.log(error);
            this.db.complete();
        };
        if (!window.indexedDB) {
            onError('IndexedDB not available');
        } else {
            const openRequest = indexedDB.open('myapp', VERSION);
            openRequest.onerror = () => onError(openRequest.error);
            openRequest.onsuccess = () => this.db.next(openRequest.result);
            openRequest.onupgradeneeded = () => {
                try {
                    const db: IDBDatabase = openRequest.result;
                    const surveyCacheStore = db.createObjectStore('mystore', { keyPath: 'key' });
                    surveyCacheStore.createIndex('value', 'value');
                    surveyCacheStore.createIndex('timestamp', 'timestamp');
                    surveyCacheStore.createIndex('ttl', 'ttl');
                } catch (error) {
                    onError(error);
                }
            };
        }
    }

    get(storeName: string, key: string): Observable<Record | null> {
        return Observable.create((observer: Observer<Record>) => {
            const onError = (error:any) => {
                console.log(error);
                observer.complete();
            };
            this.$db.subscribe((db:any) => {
                try {
                    const txn = db.transaction([storeName], 'readonly');
                    const store = txn.objectStore(storeName);
                    const getRequest: IDBRequest<Record> = store.get(key);
                    getRequest.onerror = () => onError(getRequest.error);
                    getRequest.onsuccess = () => {
                        const record = getRequest.result;
                        if (!record ||
                            new Date(Date.now() - record.timestamp).getSeconds() > record.ttl
                        ) {
                            observer.next(null as any);
                        } else {
                            observer.next(getRequest.result);
                        }
                        observer.complete();
                    };
                } catch (err) {
                    onError(err);
                }
            });
        });
    }

    put(storeName: string, value: RecordInput): Observable<IDBValidKey | null> {
        return Observable.create((observer: Observer<IDBValidKey>) => {
            const onError = (error:any) => {
                console.log(error);
                observer.complete();
            };
            this.$db.subscribe((db:any) => {
                try {
                    const txn = db.transaction([storeName], 'readwrite');
                    const store = txn.objectStore(storeName);
                    const record: Record = {...value, timestamp: Date.now()};
                    const putRequest = store.put(record);
                    putRequest.onerror = () => onError(putRequest.error);
                    putRequest.onsuccess = () => {
                        observer.next(putRequest.result);
                        observer.complete();
                    };
                } catch (err) {
                    onError(err);
                }
            });
        });
    }
}