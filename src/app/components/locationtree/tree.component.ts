import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { MdDialog, MdDialogRef, MdSnackBar } from '@angular/material';

import { Subscription } from 'rxjs/Subscription';

import { LocationService } from '../../services/location.service';
import { Location } from '../../models/location';
import { SuccessDialogService } from '../../services/success-dialog.service';
import { ErrorDialogService } from '../../services/error-dialog.service';
import { SuccessDialogComponent } from '../success-dialog/success-dialog.component';
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';

@Component({
  selector: 'tree-node',
  templateUrl: './tree.component.html',
  styleUrls: ['./tree.component.scss']
})

export class TreeNodeComponent {
  @Input() currentLocation: Location;
  @Output() onDelete = new EventEmitter<boolean>();

  childLocations: Array<Location> = [];
  errorMesssage: string;
  showChildren: boolean = false;
  subscription: Subscription;
  constructor(private locationService: LocationService,
              private router: Router,
              public dialog: MdDialog,
              public snackBar: MdSnackBar,
              private successDialogService: SuccessDialogService,
              private errorDialogService: ErrorDialogService) {

  }
  ngOnInit() {
    this.subscription = this.locationService.notifier$
       .subscribe(result => {
         if (this.currentLocation._id === result) {
             this.onCreateChild();
         }
       });
  }
  ngOnDestroy() {
    // prevent memory leak when component is destroyed
    this.subscription.unsubscribe();
  }
  reloadChildren(){
     this.locationService
        .getLocationById(this.currentLocation._id)
        .subscribe(
          result => {
                this.currentLocation = result ;
                this.getChildren() }),
          error => this.errorMesssage = error
  }

  getChildren() {
    let children = this.currentLocation.children;
    this.childLocations = [];
    for (var i = 0; i < children.length; i++) {
      this.locationService
        .getLocationById(children[i])
        .subscribe(
          result => this.childLocations.push(result),
          error => this.errorMesssage = error
        );
    }
  }

  clearChildren() {
    this.childLocations = [];
  }

  toggleChildren(curLocation: Location) {
    if (this.showChildren) {
      this.clearChildren();
      this.showChildren = false;
    }
    else {
      this.getChildren();
      this.showChildren = true;
    }
    this.toDevices(curLocation._id);
  }

  addLocation(location: Location) {
    this.router.navigate(['/home/newlocation', location._id]);
  }

  toDevices(location_id: string) {
    this.locationService.getDeviceByLocationId(location_id).subscribe(
      result =>  {
        this.router.navigate(['/home/devices/', location_id]);
      },
      error => this.errorMesssage = error
    )
  }

  deleteable() {
    return this.currentLocation.children.length == 0;
  }

  deleteLocation(location: Location) {
    let dialogRef = this.dialog.open(DeleteLocationDialog);
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.locationService
          .deleteLocationById(location._id)
          .subscribe(
            res => {
              this.successDialogService
                .dialogPopup(SuccessDialogComponent, res.message + ': ' + location.name);
              this.onDelete.emit(true);
            },
            err => {
              this.errorDialogService
                .dialogPopup(ErrorDialogComponent, err.message + ': ' + location.name);
            }
          );
      }
    });
  }

  onDeleteChild(deleted: boolean) {
    if (deleted) {
      this.clearChildren();
      this.reloadChildren();
      this.showChildren = true;
    }
  }

   onCreateChild() {
      this.clearChildren();
      this.reloadChildren();
      this.showChildren = true;

  }
}

@Component({
  selector: 'delete-location-dialog',
  template: `
    <h2>Confirmation of Deletion</h2>
    <button md-raised-button (click)="dialogRef.close(true)">Delete</button>
    <button md-raised-button (click)="dialogRef.close(false)">Cancel</button>
  `
})
export class DeleteLocationDialog {
  constructor(public dialogRef: MdDialogRef<DeleteLocationDialog>) {

  }
}
