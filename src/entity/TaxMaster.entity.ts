import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	OneToMany,
	CreateDateColumn,
	UpdateDateColumn,
	PrimaryColumn,
} from 'typeorm';
import { IsEmail, Length, Max, Min } from 'class-validator';
import { ShippingAddress } from './ShippingAddress.entity';
import { Province } from '../common/Province';

@Entity({ name: 'TBL_TAX_MASTER' })
export class TaxMaster {
	@PrimaryColumn({ type: 'enum', enum: Province })
	province: Province;

	@Column({ type: 'float', nullable: true })
	gst: number;

	@Column({ type: 'float', nullable: true })
	pst: number;

	@Column({ type: 'float', nullable: true })
	hst: number;

	@Column()
	@CreateDateColumn()
	createdAt: Date;

	@Column()
	@UpdateDateColumn()
	updatedAt: Date;

	constructor(province: Province, gst: number, pst: number, hst: number) {
		this.province = province;
		this.gst = gst;
		this.pst = pst;
		this.hst = hst;
	}
}
