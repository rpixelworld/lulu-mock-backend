import {
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';
import { ShippingAddress } from './ShippingAddress.entity';
import { DeliveryOption } from '../common/DeliveryOption';
import { IsEmail, IsEnum, Length } from 'class-validator';
import { OrderStatus } from '../common/OrderStatus';
import { OrderItem } from './OrderItem.entity';
import { User } from './User.entity';
import { PaymentMethod } from '../common/PaymentMethod';

@Entity({ name: 'TBL_ORDER' })
export class Order {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'int', nullable: false })
	status: OrderStatus;

	@OneToMany(() => OrderItem, orderItem => orderItem.order)
	orderItems: OrderItem[];

	@Column()
	@IsEmail()
	@Length(1, 64)
	notificationEmail: string;

	@ManyToOne(() => User, user => user.orders, { nullable: false })
	user: User;

	@ManyToOne(() => ShippingAddress, shippingAddress => shippingAddress.orders, { nullable: false })
	shippingAddress: ShippingAddress;

	@Column({ nullable: false, type: 'enum', enum: DeliveryOption })
	@IsEnum(DeliveryOption, { message: 'Not a valid delivery option' })
	deliveryOption: DeliveryOption;

	@Column({ nullable: false, type: 'float' })
	deliveryFee: number;

	@Column({ nullable: false, type: 'float' })
	tax: number;

	@Column({ nullable: false, type: 'int' })
	totalItem: number;

	@Column({ nullable: false, type: 'float' })
	totalAmount: number;

	@Column({ nullable: false })
	isGift: boolean;

	@Column({ nullable: true })
	@Length(0, 32)
	giftTo: string;

	@Column({ nullable: true })
	@Length(0, 32)
	giftFrom: string;

	@Column({ nullable: true })
	@Length(0, 1024)
	giftMessage: string;

	@Column({ nullable: true })
	paymentMethod: PaymentMethod;

	@Column({ nullable: true })
	paymentComment: string;

	@Column()
	@CreateDateColumn()
	createdAt: Date;

	@Column()
	@UpdateDateColumn()
	updatedAt: Date;
}
