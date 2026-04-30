import { Injectable } from "@nestjs/common";
import { LoginLogDto } from "./dto";
import { InjectRepository } from "@nestjs/typeorm";
import { FindManyOptions, Repository } from "typeorm";
import { LoginLog } from "./entity";
import { QueryListDto, ResponseListDto } from "src/common/dto";
import { BaseService } from "src/common/BaseService";
import { getSystem, getBrowser } from "src/common/utils/common";
import dayjs from "dayjs";
import { HttpService } from "@nestjs/axios";
import { BoolNum } from "src/common/type/base";

interface ProvinceStatItem {
  name: string;
  value: number;
}

interface LoginProvinceRow {
  account: string;
  address: string | null;
  createTime: Date | string;
  id: number;
}

const unknownProvinceName = "未知";

const provinceNames = [
  "黑龙江",
  "内蒙古",
  "北京",
  "天津",
  "上海",
  "重庆",
  "河北",
  "山西",
  "辽宁",
  "吉林",
  "江苏",
  "浙江",
  "安徽",
  "福建",
  "江西",
  "山东",
  "河南",
  "湖北",
  "湖南",
  "广东",
  "广西",
  "海南",
  "四川",
  "贵州",
  "云南",
  "西藏",
  "陕西",
  "甘肃",
  "青海",
  "宁夏",
  "新疆",
  "台湾",
  "香港",
  "澳门",
];

@Injectable()
export class LoginLogsService extends BaseService<LoginLog, LoginLogDto> {
  constructor(
    @InjectRepository(LoginLog) repository: Repository<LoginLog>,
    private httpService: HttpService,
  ) {
    super(LoginLog, repository);
  }

  async list(query: QueryListDto = {}): Promise<ResponseListDto<LoginLog>> {
    let { account, isSuccess, ip, address, createTimeRange } = query;
    let queryOrm: FindManyOptions = {
      where: {
        isSuccess,
        account: this.sqlLike(account),
        ip: this.sqlLike(ip),
        address: this.sqlLike(address),
        createTime: this.betweenTime(createTimeRange),
      },
    };
    return this.listBy(queryOrm, query);
  }

  /**
   * 用户访问量折线图
   * @param query { beginTime; endTime }
   * @returns
   */
  async getVisitedNumChart(
    query: QueryListDto = {},
  ): Promise<{ date: string; num: number }[]> {
    let { beginTime, endTime } = query;
    if (!beginTime || !endTime) {
      endTime = dayjs().format("YYYY-MM-DD");
      beginTime = dayjs().subtract(6, "day").format("YYYY-MM-DD");
    }
    return this.repository
      .createQueryBuilder("LoginLog")
      .select('DATE_FORMAT(LoginLog.createTime,"%Y-%m-%d")', "date")
      .addSelect("count(*)", "num")
      .where("DATE(LoginLog.createTime) BETWEEN :beginTime AND :endTime", {
        beginTime,
        endTime: endTime,
      })
      .groupBy('DATE_FORMAT(LoginLog.createTime,"%Y-%m-%d")')
      .orderBy({ 'DATE_FORMAT(LoginLog.createTime,"%Y-%m-%d")': "ASC" })
      .getRawMany()
      .then((data) => {
        // data?.forEach((element) => {
        //   element.date = dayjs(element.date).format('YYYY-MM-DD')
        // })
        return this.betweenDateArr([beginTime, endTime]).map(
          (item) =>
            data.find((element) => element.date === item) || {
              date: item,
              num: 0,
            },
        );
      });
  }

  // 用户地区列表
  getUserAreaList(query: { beginTime: any; endTime: any }) {
    let { beginTime, endTime } = query;
    return this.repository
      .createQueryBuilder("LoginLog")
      .select("LoginLog.address", "address")
      .distinctOn(["LoginLog.address"])
      .addSelect("count(*)", "num")
      .where("LoginLog.address IS NOT NULL AND LoginLog.address != ''")
      .andWhere(
        beginTime && endTime
          ? "DATE(LoginLog.createTime) BETWEEN :beginTime AND :endTime"
          : {},
        {
          beginTime,
          endTime,
        },
      )
      .groupBy("LoginLog.address")
      .orderBy({ num: "ASC" })
      .getRawMany()
      .then((data) => {
        return data.map((e) => ({ name: e.address, value: e.num }));
      });
  }

  async getUserLoginProvinceList(): Promise<ProvinceStatItem[]> {
    const rows: LoginProvinceRow[] = await this.repository
      .createQueryBuilder("LoginLog")
      .select("LoginLog.account", "account")
      .addSelect("LoginLog.id", "id")
      .addSelect("LoginLog.address", "address")
      .addSelect("LoginLog.createTime", "createTime")
      .where("LoginLog.isSuccess = :isSuccess", { isSuccess: BoolNum.Yes })
      .andWhere("LoginLog.account IS NOT NULL AND TRIM(LoginLog.account) != ''")
      .andWhere(
        `NOT EXISTS (
          SELECT 1
          FROM sys_login_log NewerLoginLog
          WHERE NewerLoginLog.account = LoginLog.account
            AND NewerLoginLog.is_success = :isSuccess
            AND NewerLoginLog.is_delete IS NULL
            AND (
              NewerLoginLog.create_time > LoginLog.create_time
              OR (
                NewerLoginLog.create_time = LoginLog.create_time
                AND NewerLoginLog.id > LoginLog.id
              )
            )
        )`,
      )
      .orderBy({
        "LoginLog.account": "ASC",
        "LoginLog.createTime": "DESC",
        "LoginLog.id": "DESC",
      })
      .getRawMany();

    const latestByAccount = new Map<string, LoginProvinceRow>();
    rows.forEach((row) => {
      if (!latestByAccount.has(row.account)) {
        latestByAccount.set(row.account, row);
      }
    });

    const provinceCount = new Map<string, number>();
    latestByAccount.forEach((row) => {
      const provinceName = this.normalizeLoginProvince(row.address);
      provinceCount.set(
        provinceName,
        (provinceCount.get(provinceName) || 0) + 1,
      );
    });

    return Array.from(provinceCount.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((current, next) => {
        if (next.value !== current.value) {
          return next.value - current.value;
        }
        return current.name.localeCompare(next.name, "zh-Hans-CN");
      });
  }

  private normalizeLoginProvince(address?: string | null): string {
    const normalizedAddress = String(address || "").trim();
    if (!normalizedAddress || normalizedAddress === "本地") {
      return unknownProvinceName;
    }

    const compactAddress = normalizedAddress.replace(/\s/g, "");
    const matchedProvince = provinceNames.find((provinceName) =>
      compactAddress.includes(provinceName),
    );

    return matchedProvince || unknownProvinceName;
  }

  async createLog(req, dto: any = {}, isSave = true) {
    let log: any = {
      ...dto,
      session: dto.session,
      account: dto.account,
      createTime: dto.loginTime,
      ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
      // address: req.hostname,
      browser: getBrowser(req.headers["user-agent"]),
      os: getSystem(req.headers["user-agent"]),
    };

    delete log.id;
    isSave && (await this.save(log));
    return log;
  }
}
