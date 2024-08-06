import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { ShippingAddress } from "./ShippingAddress.entity";
import { DeliveryOption } from "../common/DeliveryOption";
import { Province } from "../common/Province";
import { IsEnum } from "class-validator";
import { Order } from "./Order.entity";

@Entity({ name: "TBL_ORDER_ITEM" })
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  productId: string;

  @Column({ nullable: true })
  productName: string;

  @Column({ nullable: false })
  colorId: string;

  @Column({ nullable: false })
  colorAlt: string

  @Column({ nullable: false })
  size: string;

  @Column({ nullable: false, type: "float" })
  price: number;

  @Column({ nullable: false, type: "int" })
  quantity: number;

  @ManyToOne(() => Order, (order) => order.orderItems)
  order: Order;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;
}
