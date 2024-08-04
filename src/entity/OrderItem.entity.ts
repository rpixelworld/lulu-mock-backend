import {Column, Entity, OneToOne, PrimaryGeneratedColumn} from "typeorm";
import {ShippingAddress} from "./ShippingAddress.entity";
import {DeliveryOption} from "../common/DeliveryOption";
import {Province} from "../common/Province";
import {IsEnum} from "class-validator";

@Entity({ name: "TBL_ORDER" })
export class Order {

    @PrimaryGeneratedColumn()
    id: number;

    notificationEmail: string;

    @OneToOne(()=>ShippingAddress)
    ShippingAddress: ShippingAddress;

    @Column({nullable:false, type:"enum", enum: DeliveryOption})
    @IsEnum(DeliveryOption, {message: 'Not a valid delivery option'})
    deliveryOption: DeliveryOption

    @Column({nullable:false, type: "int"})
    deliveryFee: number;

    @Column({nullable:false, type: 'float'})
    tax: number;

    @Column({nullable:false, type: 'int'})
    totalItem: number;

    @Column({nullable:false, type: 'float'})
    totalAmount: number;

}