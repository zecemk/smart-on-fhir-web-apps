import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {SmartAuthService} from "../../services/smart-auth.service";

@Component({
  selector: 'lib-callback',
  templateUrl: './callback.component.html',
  styleUrl: './callback.component.css'
})
export class CallbackComponent implements OnInit {
  error?: string;

  constructor(private router: Router, private route: ActivatedRoute, private auth: SmartAuthService) {
  }

  ngOnInit() {
    this.route.data.subscribe(data => {
      this.auth.start().then(() => {
        this.router.navigate([data['redirectTo']])
      }, (error) => {
        this.error = error?.message || error?.toString() || 'Unknown error occurred.'
      })
    })
  }
}
