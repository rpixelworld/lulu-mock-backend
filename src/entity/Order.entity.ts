import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { ShippingAddress } from "./ShippingAddress.entity";
import { DeliveryOption } from "../common/DeliveryOption";
import { Province } from "../common/Province";
import { IsEmail, IsEnum, Length } from "class-validator";
import { OrderStatus } from "../common/OrderStatus";
import { OrderItem } from "./OrderItem.entity";

@Entity({ name: "TBL_ORDER" })
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int", nullable: false })
  status: OrderStatus;

  @OneToMany(() => Order, (order) => order.orderItems)
  orderItems: OrderItem[];

  @Column()
  @IsEmail()
  @Length(1, 64)
  notificationEmail: string;

  @OneToOne(() => ShippingAddress)
  ShippingAddress: ShippingAddress;

  @Column({ nullable: false, type: "enum", enum: DeliveryOption })
  @IsEnum(DeliveryOption, { message: "Not a valid delivery option" })
  deliveryOption: DeliveryOption;

  @Column({ nullable: false, type: "float" })
  deliveryFee: number;

  @Column({ nullable: false, type: "float" })
  tax: number;

  @Column({ nullable: false, type: "int" })
  totalItem: number;

  @Column({ nullable: false, type: "float" })
  totalAmount: number;

  @Column({ nullable: false })
  isGift: boolean;

  @Column({nullable: true})
  @Length(0, 32)
  giftTo: string;

  @Column({nullable: true})
  @Length(0, 32)
  giftFrom: string;

  @Column({nullable: true})
  @Length(0, 1024)
  giftMessage: string;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;
}
