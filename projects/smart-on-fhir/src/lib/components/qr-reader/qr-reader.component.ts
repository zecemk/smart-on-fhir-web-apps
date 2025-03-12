import { Component, ElementRef, OnInit, ViewChild, OnDestroy } from '@angular/core';
import jsQR, {QRCode} from 'jsqr';
import {Router} from "@angular/router";

@Component({
  selector: 'lib-qr-reader',
  templateUrl: './qr-reader.component.html',
  styleUrls: ['./qr-reader.component.scss']
})
export class QrReaderComponent implements OnInit, OnDestroy {
  @ViewChild('video', { static: true }) videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas', { static: true }) canvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileCanvas', { static: true }) fileCanvasElement!: ElementRef<HTMLCanvasElement>;

  videoStream!: MediaStream;
  scanning: boolean = false;
  qrResult: string | null = null;
  error: string|undefined;

  constructor(private router: Router) {
  }

  ngOnInit(): void {
    (<any>window)['jsqr'] = jsQR;
    this.startCamera();
  }
  async startCamera() {
    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const video = this.videoElement.nativeElement;
      video.srcObject = this.videoStream;

      video.onloadedmetadata = () => {
        video.play();
        this.scanning = true;
        this.scanQRCode();
      };
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  }

  scanQRCode() {
    if (!this.scanning) return;

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const scan = () => {
      if (!this.scanning) return;

      // Ensure video dimensions are available
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        requestAnimationFrame(scan);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        this.checkCode(code)
      } else {
        requestAnimationFrame(scan);
      }
    };

    scan();
  }

  scanFile(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = this.fileCanvasElement.nativeElement;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0, img.width, img.height);

            const imageData = ctx.getImageData(0, 0, img.width, img.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);

            if (code) {
              this.checkCode(code)
            } else {
              this.error = 'The file does not contain a valid QR.'
            }
          }
        };
      };

      reader.readAsDataURL(file);
    }
  }

  stopCamera() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
    }
    this.scanning = false;
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  private checkCode(code: QRCode) {
    this.qrResult = code.data;
    if (!(this.qrResult.startsWith('shc:/') || this.qrResult.startsWith('shlink:/'))) {
      this.error = 'QR doesn\' contain a SMART Health Card or Link';
    } else {
      this.router.navigate([!this.qrResult.startsWith('shc:/') ? '/shc' : '/shl'], { fragment: this.qrResult })
      this.stopCamera();
    }
  }
}
