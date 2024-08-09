import {
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	OneToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';
import { Order } from './Order.entity';

@Entity({ name: 'TBL_ORDER_ITEM' })
export class OrderItem {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ nullable: false })
	productId: string;

	@Column({ nullable: true })
	productName: string;

	@Column({ nullable: true })
	imageUrl: string;

	@Column({ nullable: false })
	colorId: string;

	@Column({ nullable: false })
	colorAlt: string;

	@Column({ nullable: false })
	size: string;

	@Column({ nullable: false, type: 'float' })
	price: number;

	@Column({ nullable: false, type: 'int' })
	quantity: number;

	@ManyToOne(() => Order, order => order.orderItems)
	order: Order;

	@Column()
	@CreateDateColumn()
	createdAt: Date;

	@Column()
	@UpdateDateColumn()
	updatedAt: Date;
}
