import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn, BeforeInsert, BeforeUpdate,
} from "typeorm";
import * as bcrypt from "bcrypt"

import { IsEmail, Length, Max, Min } from "class-validator";
import { ShippingAddress } from "./ShippingAddress.entity";

@Entity({ name: "TBL_USER" })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Length(1, 300)
  firstName: string;

  @Column()
  @Length(1, 300)
  lastName: string;

  @Column({ nullable: false })
  @Min(1)
  @Max(150)
  age: number;

  @Column({ nullable: false, unique: true })
  @IsEmail()
  @Length(5, 500)
  email: string;

  @Column({ nullable: false })
  @Length(6, 100)
  password: string;

  // Hash the password before saving
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  // Compare hashed password with plain text password
  async comparePassword(plainPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, this.password);
  }

  @Column({nullable:false})
  isAdmin: boolean;

  @OneToMany(() => ShippingAddress, (shippingAddress) => shippingAddress.user)
  shippingAddresses: ShippingAddress[];

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;

  constructor(
    firstName: string,
    lastName: string,
    age: number,
    email: string,
    password: string,
  ) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.age = age;
    this.email = email;
    this.password = password;
    this.isAdmin = false;
  }
}
