import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	CreateDateColumn,
	UpdateDateColumn,
	OneToMany,
} from 'typeorm';
import {
	IsEnum,
	isPhoneNumber,
	IsPhoneNumber,
	IsPostalCode,
	Length,
	Max,
	Min,
	registerDecorator,
	ValidationArguments,
	ValidationOptions,
} from 'class-validator';
import { Province } from '../common/Province';
import { User } from './User.entity';
import { Order } from './Order.entity';

@Entity({ name: 'TBL_SHIPPING_ADDRESS' })
export class ShippingAddress {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ nullable: false, default: true })
	inUsersAddressList: boolean;

	@Column({ nullable: false })
	@Length(1, 300)
	firstName: string;

	@Column({ nullable: false })
	@Length(1, 300)
	lastName: string;

	@Column({ nullable: false })
	@IsCanadianPhoneWithoutCountryCode({
		message: 'Phone number should be a valid Canadian number without the +1 country code.',
	})
	phoneNumber: string;

	@Column({ nullable: false })
	@Length(1, 300)
	addressLine: string;

	@Column({ nullable: false })
	@Length(1, 64)
	city: string;

	@Column({ nullable: false, type: 'enum', enum: Province })
	@IsEnum(Province, { message: 'Not a valid province of Canada' })
	province: Province;

	@Column({ nullable: false })
	@Length(1, 6)
	@IsPostalCode('CA')
	postalCode: string;

	@Column({ nullable: false })
	@Length(1, 6)
	countryCode: string;

	@ManyToOne(() => User, user => user.shippingAddresses)
	user: User;

	@OneToMany(() => Order, order => order.shippingAddress)
	orders: Order[];

	@Column()
	@CreateDateColumn()
	createdAt: Date;

	@Column()
	@UpdateDateColumn()
	updatedAt: Date;
}

function IsCanadianPhoneWithoutCountryCode(validationOptions?: ValidationOptions) {
	return function (object: Object, propertyName: string) {
		registerDecorator({
			name: 'isCanadianPhoneWithoutCountryCode',
			target: object.constructor,
			propertyName: propertyName,
			options: validationOptions,
			validator: {
				validate(value: any, args: ValidationArguments) {
					// Check that the value does not include the +1 country code
					if (typeof value !== 'string' || value.startsWith('+1')) {
						return false;
					}

					// Check that the value is a valid Canadian phone number without country code
					const phoneRegex = /^[2-9]\d{2}[2-9]\d{2}\d{4}$/;
					return phoneRegex.test(value) && isPhoneNumber(`+1${value}`, 'CA');
				},
				defaultMessage(args: ValidationArguments) {
					return 'Phone number must be a valid 10-digit Canadian phone number without the +1 country code';
				},
			},
		});
	};
}
