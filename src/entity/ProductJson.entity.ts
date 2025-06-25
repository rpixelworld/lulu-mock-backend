import {Column, Entity, PrimaryColumn, Unique} from "typeorm";

@Entity({ name: 'TBL_PRODUCT_JSON' })
@Unique(['productId'])
export class ProductJson {
  @PrimaryColumn()
  productId: string;

  @Column({nullable: false})
  productDetail: string;

  constructor(productId: string, productJson: string) {
    this.productId = productId;
    this.productDetail = productJson;
  }
}