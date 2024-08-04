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

@Entity({ name: "TBL_INVENTORY" })
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  productId: string;

  @Column({ nullable: false })
  colorId: string;

  @Column({ nullable: false })
  size: string;

  @Column({ nullable: false, type: "int" })
  stock: number;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;
}
