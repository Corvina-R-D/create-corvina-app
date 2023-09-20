import { Model, Table, Column, DataType, AllowNull } from 'sequelize-typescript';

@Table
export class Installation extends Model {
  @AllowNull(false)
  @Column({ type: DataType.STRING(50) })
  apiVersion: string;

  @AllowNull(false)
  @Column({ type: DataType.STRING(200) })
  clientId: string;

  @AllowNull(false)
  @Column({ type: DataType.STRING(200) })
  clientSecret: string;

  @Column({ type: DataType.STRING(256) })
  baseUrl: string;

  @AllowNull(false)
  @Column({ type: DataType.STRING(1024) })
  apiBaseUrl: string;

  @AllowNull(false)
  @Column({ type: DataType.STRING(256) })
  authBaseUrl: string;

  @AllowNull(false)
  @Column({ type: DataType.STRING(1024) })
  openIdConfigurationUrl: string;

  @AllowNull(false)
  @Column({ type: DataType.STRING(256) })
  wsBaseUrl: string;

  @Column({ type: DataType.STRING(50), primaryKey: true })
  organizationId: string;

  @Column({ type: DataType.UUID, primaryKey: true })
  instanceId: string;

  @AllowNull(false)
  @Column({ type: DataType.STRING(500) })
  realmValidationRole: string;

  @AllowNull(false)
  @Column({ type: DataType.STRING(50) })
  realm: string;
}
