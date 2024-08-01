import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";
import {IsEmail, Length, Max, Min} from "class-validator";

@Entity({name: "tbl_User"})
export class UserEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Length(1, 300)
    firstName: string;

    @Column()
    @Length(1, 300)
    lastName: string;

    @Column({nullable: false})
    @Min(1)
    @Max(150)
    age: number;

    @Column({nullable:false, unique:true})
    @IsEmail()
    @Length(5, 500)
    email: string;

    @Column({nullable:false})
    @Length(6, 100)
    password: string;

    constructor(firstName: string, lastName: string, age: number, email: string, password: string) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.age = age;
        this.email = email;
        this.password = password;
    }
}
