import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import {
  IsEnum,
  IsPhoneNumber,
  IsPostalCode,
  Length,
  Max,
  Min,
} from "class-validator";
import { Province } from "../common/Province";
import { User } from "./User.entity";

@Entity({ name: "TBL_SHIPPING_ADDRESS" })
export class ShippingAddress {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  @Length(1, 300)
  firstName: string;

  @Column({ nullable: false })
  @Length(1, 300)
  lastName: string;

  @Column({ nullable: false })
  @IsPhoneNumber("CA")
  phoneNumber: string;

  @Column({ nullable: false })
  @Length(1, 300)
  addressLine: string;

  @Column({ nullable: false })
  @Length(1, 64)
  city: string;

  @Column({ nullable: false, type: "enum", enum: Province })
  @IsEnum(Province, { message: "Not a valid province of Canada" })
  province: Province;

  @Column({ nullable: false })
  @Length(1, 6)
  @IsPostalCode("CA")
  postalCode: string;

  @ManyToOne(() => User, (user) => user.shippingAddresses)
  user: User;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;
}
