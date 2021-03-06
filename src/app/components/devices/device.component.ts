import { Component, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { MdSnackBar, MdMenuModule, MdSnackBarConfig } from '@angular/material';
import 'rxjs/add/operator/switchMap';

import { Device } from '../../models/device';
import { DeviceService } from '../../services/device.service';
import { SuccessDialogService } from '../../services/success-dialog.service';
import { SuccessDialogComponent } from '../success-dialog/success-dialog.component';
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';
import { UserService } from '../../services/user.service';
import { ErrorDialogService } from '../../services/error-dialog.service';

@Component({
  selector: 'device-info',
  templateUrl: './device.component.html',
  styleUrls: ['./device.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class DeviceComponent {
  device: Device = null;
  errorMessage: string = "";
  successMessage: string = "";
  deviceTypes: Array<string> = ["LORA", "TWIST", "FIREFLY", "BOSCH_XDK"];
  services: Array<Object> = [];

  // New Transducer
  t_name: string = "";
  t_unit: string = "";
  t_actuable: boolean = false;
  t_publishPayload: string = "";

  // New Command
  c_name: string = "";
  c_value: string = "";
  c_transducer: any = null;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private deviceService: DeviceService,
              public snackBar: MdSnackBar,
              private successDialogService: SuccessDialogService,
              private errorDialogService: ErrorDialogService,
              private userService: UserService) {

  }

  ngOnInit() {
    this.getDevice();
  }

  saveTemplate() {
    this.router.navigate(['/home/newtemplate/', this.device._id]);
  }

  getDevice() {
    this.route.params
      .switchMap((params: Params) => this.deviceService.getDeviceById(params['id']))
      .subscribe(
        result => {
          this.device = result;
          //TODO: FIx the hackish code below
          var serviceIds = this.device.linked_services.map((x: any) => x.service_id);
          this.deviceService.getDeviceTransducers(this.device._id).subscribe(
            out => {
              this.device.transducers = out;
              for (var i = 0; i < serviceIds.length; i++) {
                this.userService.getServiceByID(serviceIds[i]).subscribe(
                  res => this.services.push(res)
              );
            }
          });
        },
        error => this.router.navigate(['/home'])
      );
  }

  deleteDevice() {
    if (this.device) {
      this.deviceService.deleteDevice(this.device._id).subscribe(
        result => {
          this.successDialogService
            .dialogPopup(SuccessDialogComponent, 'Successfully deleted: ' + this.device.name);
          this.router.navigate(['/home']);
        },
        error => this.successDialogService
                  .dialogPopup(SuccessDialogComponent, error.message + ': ' + this.device.name)
      );
    }
  }

  updateDevice() {
    this.deviceService.updateDeviceById(this.device._id, this.device).subscribe(
      result => {
        this.successMessage = 'Updated: ';
        this.successDialogService
          .dialogPopup(SuccessDialogComponent, this.successMessage + this.device.name);
        this.router.navigate(['/home/device/', this.device._id]);
      },
      error => {
        this.errorDialogService
          .dialogPopup(ErrorDialogComponent, error.message + ': ' + this.device.name);
      }
    );
  }

  execute(command: any) {
    this.deviceService.executeCommand(this.device._id, command._id).subscribe(
      result => {
        this.successDialogService
          .dialogPopup(SuccessDialogComponent, 'Executed: ' + command.name);
      },
      error => {
        this.errorDialogService
          .dialogPopup(ErrorDialogComponent, error.message + ': ' + command.name);
      }
    );
  }

  newTransducer() {
    if (this.t_name != "" && this.t_unit != "") {
      var body = {
        name: this.t_name,
        unit: this.t_unit,
        is_actuable: this.t_actuable
      };
      this.deviceService.addTransducer(this.device._id, body).subscribe(
        result => {
          this.successDialogService
            .dialogPopup(SuccessDialogComponent, 'New Transducer Added: ' + this.t_name);
          this.t_name = "";
          this.t_unit = "";
          this.t_actuable = false;
          this.getDevice();
        },
        error => {
          this.errorDialogService
            .dialogPopup(ErrorDialogComponent, error.message + ': ' + this.t_name);
        }
      );
    } else {
      this.errorDialogService
        .dialogPopup(ErrorDialogComponent, 'Name/Unit cannot be empty!');
    }
  }
   publishToTransducer(t_id: string, t_name: string) {

    this.deviceService.publishToTransducer(this.device._id, t_id, this.t_publishPayload).subscribe(
      result => {
        this.successDialogService
          .dialogPopup(SuccessDialogComponent, 'Published to : ' + t_name);
        this.getDevice();
      },
      error => {
        this.errorDialogService
          .dialogPopup(ErrorDialogComponent, error.message + ': ' + t_name);
      }
    );
  }

  deleteTransducer(t_id: string, t_name: string) {
    this.deviceService.deleteTransducer(this.device._id, t_id).subscribe(
      result => {
        this.successDialogService
          .dialogPopup(SuccessDialogComponent, 'Transducer Deleted: ' + t_name);
        this.getDevice();
      },
      error => {
        this.errorDialogService
          .dialogPopup(ErrorDialogComponent, error.message + ': ' + t_name);
      }
    );
  }

  newCommand() {
    if (this.c_name && this.c_value && this.c_transducer) {
      var body = {
        name: this.c_name,
        transducer_id: this.c_transducer._id,
        value: this.c_value
      };
      this.deviceService.addCommand(this.device._id, body).subscribe(
        result => {
          this.successDialogService
            .dialogPopup(SuccessDialogComponent, 'Command Added: ' + this.c_name);
          this.c_name = "";
          this.c_transducer = null;
          this.c_value = "";
          this.getDevice();
        },
        error => {
          this.errorDialogService
            .dialogPopup(ErrorDialogComponent, error.message + ': ' + this.c_name);
        }
      );
    } else {
      this.errorDialogService
        .dialogPopup(ErrorDialogComponent, 'Name/Value/Transducer cannot be empty!');
    }
  }

  deleteCommand(c_id: string, c_name: string) {
    this.deviceService.deleteCommand(this.device._id, c_id).subscribe(
      result => {
        this.successDialogService
          .dialogPopup(SuccessDialogComponent, 'Command Deleted: ' + c_name);
        this.getDevice();
      },
      error => {
        this.errorDialogService
          .dialogPopup(ErrorDialogComponent, error.message + ': ' + c_name);
      }
    );
  }

  toService(id: string) {
    this.router.navigate(['/home/service/', id]);
  }

}
