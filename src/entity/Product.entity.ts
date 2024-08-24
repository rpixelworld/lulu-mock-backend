import { Column, Entity, PrimaryColumn, Unique } from 'typeorm';

@Entity({ name: 'TBL_PRODUCT' })
@Unique(['productId', 'colorId'])
export class Product {
	@PrimaryColumn()
	productId: string;

	@PrimaryColumn()
	colorId: string;

	@Column({ nullable: false })
	productName: string;

	@Column({ nullable: false })
	colorAlt: string;

	@Column({ nullable: false })
	fullnameWithColor: string;

	@Column({ type: 'text', nullable: false })
	imageUrls: string;

	@Column({ nullable: true, default: false })
	men: boolean;

	@Column({ nullable: true, default: false })
	female: boolean;

	@Column({ nullable: true, default: false })
	leggings: boolean;

	@Column({ nullable: true, default: false })
	shirts: boolean;

	@Column({ nullable: true, default: false })
	coatsAndJackets: boolean;

	@Column({ nullable: true, default: false })
	joggers: boolean;

	@Column({ nullable: true, default: false })
	hoodiesAndSweatshirts: boolean;

	@Column({ nullable: true, default: false })
	accessories: boolean;

	@Column({ nullable: true, default: false })
	bags: boolean;

	@Column({ nullable: true, default: false })
	bodysuits: boolean;

	@Column({ nullable: true, default: false })
	buttonDownShirts: boolean;

	@Column({ nullable: true, default: false })
	capris: boolean;

	@Column({ nullable: true, default: false })
	dresses: boolean;

	@Column({ nullable: true, default: false })
	hairAccessories: boolean;

	@Column({ nullable: true, default: false })
	hats: boolean;

	@Column({ nullable: true, default: false })
	longSleeveShirts: boolean;

	@Column({ nullable: true, default: false })
	pants: boolean;

	@Column({ nullable: true, default: false })
	poloShirts: boolean;

	@Column({ nullable: true, default: false })
	shortSleeveShirts: boolean;

	@Column({ nullable: true, default: false })
	shorts: boolean;

	@Column({ nullable: true, default: false })
	socks: boolean;

	@Column({ nullable: true, default: false })
	sportsBras: boolean;

	@Column({ nullable: true, default: false })
	sweaters: boolean;

	@Column({ nullable: true, default: false })
	sweatpants: boolean;

	@Column({ nullable: true, default: false })
	tshirts: boolean;

	@Column({ nullable: true, default: false })
	tankTops: boolean;

	@Column({ nullable: true, default: false })
	trackPants: boolean;

	@Column({ nullable: true, default: false })
	trousers: boolean;

	@Column({ nullable: true, default: false })
	underwear: boolean;

	@Column({ nullable: true, default: false })
	waterBottles: boolean;

	@Column({ nullable: true, default: false })
	yogaAccessories: boolean;

	@Column({ nullable: true, default: false })
	yogaMats: boolean;

	@Column({ nullable: true, default: false })
	hoodies: boolean;

	constructor(productId: string, colorId: string) {
		this.productId = productId;
		this.colorId = colorId;
	}
}
