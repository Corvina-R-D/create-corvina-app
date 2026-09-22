import { Model, Table, Column, DataType, AllowNull } from 'sequelize-typescript';

@Table
export class Installation extends Model {
  @AllowNull(false)
  @Column({ type: DataType.STRING(50) })
  declare apiVersion: string;

  @AllowNull(false)
  @Column({ type: DataType.STRING(200) })
  declare clientId: string;

  @AllowNull(false)
  @Column({ type: DataType.STRING(200) })
  declare clientSecret: string;

  @Column({ type: DataType.STRING(256) })
  declare baseUrl: string;

  @AllowNull(false)
  @Column({ type: DataType.STRING(1024) })
  declare apiBaseUrl: string;

  @AllowNull(false)
  @Column({ type: DataType.STRING(256) })
  declare authBaseUrl: string;

  @AllowNull(false)
  @Column({ type: DataType.STRING(1024) })
  declare openIdConfigurationUrl: string;

  @AllowNull(false)
  @Column({ type: DataType.STRING(256) })
  declare wsBaseUrl: string;

  @Column({ type: DataType.BIGINT, primaryKey: true })
  declare organizationId: string;

  @Column({ type: DataType.UUID, primaryKey: true })
  declare instanceId: string;

  @AllowNull(false)
  @Column({ type: DataType.STRING(500) })
  declare realmValidationRole: string;

  @AllowNull(false)
  @Column({ type: DataType.STRING(50) })
  declare realm: string;

  @Column({ type: DataType.STRING(256) })
  declare orgResourceId: string;

  @Column({ type: DataType.DATE })
  declare endDate?: Date;

  @Column({ type: DataType.STRING(1024) })
  declare planId?: string;

  @AllowNull(false)
  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare freeTrial: boolean;
}
