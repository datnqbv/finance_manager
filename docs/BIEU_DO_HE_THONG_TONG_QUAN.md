# BIEU DO HE THONG TONG QUAN (PLANTUML)

## Mo ta
Bieu do ben duoi mo ta kien truc tong quan cho he thong Quan ly chi tieu, gom Frontend, Backend, CSDL va cac dich vu ngoai.

```plantuml
@startuml
left to right direction
skinparam shadowing false
skinparam packageStyle rectangle
skinparam linetype ortho
skinparam nodesep 70
skinparam ranksep 90
skinparam ArrowFontSize 11

actor "Người dùng" as User
actor "Quản trị viên" as Admin

rectangle "Client - React Vite" as FE {
    component "UI Pages" as FE1
    component "Context State Management" as FE2
    component "Service Layer - API Client" as FE3
    FE1 --> FE2
    FE2 --> FE3
}

rectangle "Server - Node.js Express" as BE {
    component "Routes" as BE1
    component "Middleware\nAuth Validation Error Handler" as BE2
    component "Controllers" as BE3
    component "Services" as BE4
    component "Models" as BE5
    BE1 --> BE2
    BE2 --> BE3
    BE3 --> BE4
    BE4 --> BE5
}

database "MongoDB" as DB

cloud "Chức năng ngoài" as EXT {
    component "Email Service\nOTP Reset Password" as EXT1
    component "File Import CSV Excel" as EXT2
}

' Ranh buoc bo cuc de giu khung hinh chu nhat (ngang)
User -[hidden]down- Admin
FE -[hidden]right- BE
BE -[hidden]right- DB
DB -[hidden]down- EXT

User <--> FE : Tuong tac UI\nva xem bao cao
Admin --> FE : Quan tri he thong
FE3 --> BE1 : HTTPS REST API
BE5 --> DB : CRUD
BE4 --> EXT1
BE4 --> EXT2
DB --> BE4 : Du lieu nghiep vu\n(giao dich, ngan sach, muc tieu, no)
BE3 --> FE3 : JSON Response
@enduml
```

## Cach xuat thanh anh
1. Cai extension PlantUML trong VS Code (neu chua co).
2. Mo file nay, dat con tro trong khoi PlantUML.
3. Mo command palette va chay lenh PlantUML: Preview Current Diagram.
4. Chon Export Current Diagram de xuat PNG/SVG (nen chon bo cuc trang ngang 16:9 de dung khung chu nhat).

## Phien ban khung chu nhat day (de dua vao bao cao)

```plantuml
@startuml
left to right direction
skinparam shadowing false
skinparam linetype ortho
skinparam nodesep 70
skinparam ranksep 90
skinparam rectangle {
    BorderThickness 2
}

actor "Nguoi dung" as User
actor "Quan tri vien" as Admin

rectangle "HE THONG QUAN LY CHI TIEU" as SYS {
    rectangle "Client - React Vite" as FE {
        component "UI Pages" as FE1
        component "Context State Management" as FE2
        component "Service Layer - API Client" as FE3
        FE1 --> FE2
        FE2 --> FE3
    }

    rectangle "Server - Node.js Express" as BE {
        component "Routes" as BE1
        component "Middleware\nAuth Validation Error Handler" as BE2
        component "Controllers" as BE3
        component "Services" as BE4
        component "Models" as BE5
        BE1 --> BE2
        BE2 --> BE3
        BE3 --> BE4
        BE4 --> BE5
    }

    database "MongoDB" as DB

    FE -[hidden]right- BE
    BE -[hidden]right- DB
}

cloud "Dich vu ngoai" as EXT {
    component "Email Service\nOTP Reset Password" as EXT1
    component "File Import CSV Excel" as EXT2
}

User --> FE : Su dung he thong
Admin --> FE : Quan tri
FE3 --> BE1 : HTTPS REST API
BE5 --> DB : CRUD
BE4 --> EXT1
BE4 --> EXT2
BE3 --> FE3 : JSON Response

User -[hidden]down- Admin
SYS -[hidden]down- EXT
@enduml
```
