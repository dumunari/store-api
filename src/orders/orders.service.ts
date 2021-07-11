import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import {InjectRepository} from "@nestjs/typeorm";
import {EntityNotFoundError, In, Repository} from "typeorm";
import {Order} from "./entities/order.entity";
import {Product} from "../products/entities/product.entity";
import { validate as uuidValidate } from 'uuid';

@Injectable()
export class OrdersService {
  constructor(
      @InjectRepository(Product) private productRepo: Repository<Product>,
      @InjectRepository(Order) private orderRepo: Repository<Order>,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const order = this.orderRepo.create(createOrderDto);
    const products = await this.productRepo.find({
      where: {
        id: In(order.items.map((item) => item.product_id)),
      },
    })

    order.items.forEach((item) => {
      const product = products.find(
          (product) => product.id === item.product_id,
      );
      item.price = product.price;
    })

    return this.orderRepo.save(order);
  }

  findAll() {
    return this.orderRepo.find();
  }

  async findOne(id: string) {
    let where;
    if (uuidValidate(id)) {
      where = { id: id }
    } else {
      throw new EntityNotFoundError(Order, id);
    }
    return await this.orderRepo.findOne(where);
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    const updateResult = await this.orderRepo.update(id, updateOrderDto);
    if (!updateResult.affected) {
      throw new EntityNotFoundError(Order, id);
    }
    return this.orderRepo.findOne(id);
  }

  async remove(id: string) {
    const deleteResult = await this.orderRepo.delete(id);
    if (!deleteResult.affected) {
      throw new EntityNotFoundError(Order, id);
    }
  }
}
