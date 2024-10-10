import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors  } from '@angular/forms';

@Component({
  selector: 'app-registro',
  templateUrl: './registro_component.html',
  styleUrls: ['./registro_component.css']
})
export class RegistroComponent {
  registerForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.registerForm = this.fb.group({
      rut: ['', [Validators.required]],
      primer_nombre: ['', [Validators.required]],
      segundo_nombre: [''],
      apellido_paterno: ['', [Validators.required]],
      apellido_materno: ['', [Validators.required]],
      correo: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required]],
      direccion: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      console.log(this.registerForm.value);
      //Pendiente hasta que se implemente el backend
    } else {
      this.registerForm.markAllAsTouched();
    }
  }
}