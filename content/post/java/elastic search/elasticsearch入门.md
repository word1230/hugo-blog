---
title: Elasticsearch入门
date: 2025-05-06T19:40:49+08:00
draft: false
categories:
  - 技术学习笔记
series:
  - elasticsearch
series_weight: 2
---

{{< series >}}

## 相关概念


Elasticsearch是面向文档(document oriented)的，这意味着它可以存储整个对象或文档(document)。然而它不仅仅是存储，还会索引(index)每个文档的内容使之可以被搜索。在Elasticsearch中，你可以对文档（而非成行成列的数据）进行索引、搜索、排序、过滤。Elasticsearch比传统关系型数据库如下：

 Relational DB -> Databases -> Tables -> Rows -> Columns  
 Elasticsearch -> Indices   -> Types  -> Documents -> Fields

1. 索引

类似于关系型数据库的表， 是存储具有相似结构文档的容器，索引定义了数据的映射（字段类型）和设置（分片数，副本数）

- **分片（Shard）**：索引可拆分为多个分片，支持水平扩展（分片数创建后不可修改）。
- **副本（Replica）**：每个分片的副本，用于高可用和并行查询。
- **别名（Alias）**：为索引设置别名，便于无缝切换或合并索引（如日志滚动场景）。

2. 文档

数据存储的基本单元， 类似于数据库的行， 每个文档有唯一_id

- **元数据**：包括 `_index`（所属索引）、`_version`（版本号）、`_source`（原始 JSON）。
- **近实时（NRT）**：文档写入后约 1 秒可被搜索（因内存 buffer 刷新到分片的延迟）。

3. 映射

定义索引中，字段的类型和属性（是否分词，是否索引），类似于数据库的表结构

- **动态映射**：自动推断字段类型（如字符串默认映射为 `text` 和 `keyword`）。
- **显式映射**：手动定义字段（如指定 `age` 为 `integer`，`content` 使用 `ik_max_word` 分词器）。

4. 字段
文档的单个属性， 类似于列，每个字段有数据类型（text，keyword，date等）

- `text`：全文检索字段，会被分词。
- `keyword`：精确匹配字段（如状态标签、ID）。
- `nested`：嵌套对象字段（独立存储数组中的对象）。
- `geo_point`：地理位置坐标。


> 分布式架构的核心概念

1. 节点

2. 集群

3. 分片

4. 路由



## 安装


### 使用docker 安装





## 客户端操作
