import { Component, OnInit } from '@angular/core';
import { IndexedDbService } from '../services/indexed-db.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {

  name = 'Angular';
  key: any;
  value: any;
  result: string;
  form:FormGroup;
  
  constructor(public indexedDb: IndexedDbService,private _fb:FormBuilder) { }

  validation(){
    this.form = this._fb.group({
      key:['',Validators.required],
      value: ['',Validators.required]
    })
  }

  ngOnInit(): void {
      this.validation();
      console.log(this.form);
      this.key = document.getElementById('key');
      this.value = document.getElementById('value');
  }

  get() {
    this.result = 'storing...';
    this.indexedDb.get('mystore', this.key.value)
    .subscribe(
      x => {
        this.result = `FOUND: ${JSON.stringify(x)}`;
      },
      err => {
        this.result = `ERROR: ${err}`;
      }
    );
  }
  
  put() {
    this.result = 'processing...';
    this.indexedDb.put('mystore', {key: this.key.value, value: this.value.value, ttl: 60*5})
    .subscribe(
      x => this.result = `STORED: ${JSON.stringify(x)}`, 
      err => {
        this.result = `ERROR: ${err}`;
      }
    );
  }

  // clear() {
  //   this.result = 'processing...';
  //   this.indexedDb.clear('mystore')
  //   .subscribe(
  //     () => this.result = `CLEARED ALL RECORDS`, 
  //     err => {
  //       this.result = `ERROR: ${err}`;
  //     }
  //   );
  // }

}
