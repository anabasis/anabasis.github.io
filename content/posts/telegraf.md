---
title: Telegraf
date: 2026-06-14T20:54:12+09:00
draft: false
category: 개발
tags:
  - telegraf
  - splunk hec
velog: true
---

# Telegraf 연동 방안

🟩 1. Linux에서 Telegraf 설치 (Ubuntu/Debian 기준)

1) InfluxData 공식 저장소 추가

```bash
curl --silent --location -O https://repos.influxdata.com/influxdata-archive.key
gpg --show-keys --with-fingerprint --with-colons ./influxdata-archive.key
cat influxdata-archive.key | gpg --dearmor | sudo tee /etc/apt/keyrings/influxdata-archive.gpg > /dev/null
echo "deb [signed-by=/etc/apt/keyrings/influxdata-archive.gpg] https://repos.influxdata.com/ubuntu stable main" | sudo tee /etc/apt/sources.list.d/influxdata.list
```

1) 설치

```bash
sudo apt-get update
sudo apt-get install telegraf -y
```

1) 서비스 시작

```bash
sudo systemctl enable telegraf
sudo systemctl start telegraf
sudo systemctl status telegraf
```

🟦 2. 설정 파일 위치

- /etc/telegraf/telegraf.conf

🟩 3. Modbus Input + Splunk HEC Output 설정 (완성본)
아래 설정은 그대로 복사해서 사용 가능한 실전 템플릿이야.
📌 `/etc/telegraf/telegraf.conf` 예시

```properties
# ============================
# INPUT: Modbus TCP
# ============================
[[inputs.modbus]]
name = "iot_sensor_01"
controller = "tcp://192.168.10.50:502"
slave_id = 1
timeout = "1s"
configuration_type = "register"

holding_registers = [
  { name = "temperature", byte_order = "AB", data_type = "INT16", scale = 0.1, address = [0] },
  { name = "humidity", byte_order = "AB", data_type = "INT16", scale = 0.1, address = [1] },
  { name = "co2", byte_order = "ABCD", data_type = "FLOAT32", scale = 1, address = [2,3] }
]

# ============================
# OUTPUT: Splunk HEC
# ============================
[[outputs.http]]
url = "https://splunk-hec.example.com:8088/services/collector"
method = "POST"
token = "YOUR_SPLUNK_HEC_TOKEN"
data_format = "splunkmetric"
timeout = "5s"
```

🟦 4. 설정 테스트
Modbus 입력 테스트

```bash
telegraf --config /etc/telegraf/telegraf.conf --test
```

Splunk HEC 연결 확인
Splunk에서 HEC가 활성화되어 있어야 하고, 토큰이 유효해야 해.

🟩 5. 방화벽 설정 (필요 시)
Modbus TCP 포트 허용
sudo ufw allow 502/tcp

Splunk HEC 포트 허용
sudo ufw allow 8088/tcp

🟦 6. 전체 흐름 요약
Modbus Sensor → Telegraf(Modbus Input) → Splunk HEC(Output)

Telegraf가 Modbus 레지스터를 읽고
Splunk HEC로 Metric 형태로 전송
Splunk에서 index=metrics 또는 지정한 인덱스로 조회 가능

## 기타

- 너의 센서 레지스터 맵 기반으로 완성된 telegraf.conf
- 여러 Modbus 장비를 동시에 수집하는 설정
- Splunk에서 Modbus 데이터를 시각화하는 대시보드 템플릿
- Telegraf를 systemd 서비스로 자동 재시작하도록 구성
