---
title: Rabbitmq入门
date: 2025-04-24T18:10:43+08:00  
tags: ["消息队列"]
categories:  ["java","消息队列"] 
---
# Rabbitmq的安装



1. 下载erlang 语言
2. 下载Rabbitmq


安装管理插件



使用docker 安装


# Rabbitmq 管理插件角色分类

登录图形界面的用户的角色有五种

1. none   不能访问management plugin
2. management 可以看自己的
3. policymaker 可以创建
4. monitoring  可以看所有的
5. administrator  可以操作所有的


可以在图形化界面中增加用户
![image.png](https://cdn.jsdelivr.net/gh/word1230/picture@main/resources/202504260940346.png)






# 简单模式入门案例
简单模式：  只有一个生产者和一个消费者


步骤：
1. 新建maven工程
2. 导包

```xml
<dependencies>  
    <dependency>  
        <groupId>com.rabbitmq</groupId>  
        <artifactId>amqp-client</artifactId>  
        <version>5.10.0</version>  
    </dependency>  
</dependencies>
```

3. 写生产者
 创建工程 - 创建连接  -创建通道 -创建队列 -生产信息 - 关闭连接

```java
public class Producer {  
    public static void main(String[] args) throws IOException {  
  
        //1. 创建工程  
  
        ConnectionFactory factory = new ConnectionFactory();  
        factory.setHost("localhost");  
        factory.setPort(5672);  
        factory.setUsername("guest");  
        factory.setPassword("guest");  
        factory.setVirtualHost("/");  
  
  
        Connection connection = null;  
        // 2. 创建连接  
        try{  
            connection = factory.newConnection("生产这");  
            //3. 创建通道  
            Channel channel = connection.createChannel();  
  
            //4. 创建队列  
            channel.queueDeclare("simple", false, false, false, null);  

            //5. 发送信息  
  
            String message = "Hello Rabbitmq";  
  
            channel.basicPublish("", "simple", null, message.getBytes());  
  
            System.out.println(" [x] Sent '" + message + "'");  
  
        } catch (IOException e) {  
            throw new RuntimeException(e);  
        } catch (TimeoutException e) {  
            throw new RuntimeException(e);  
        }finally {  
            //6. 关闭通道  
            if(connection != null){  
                connection.close();  
            }  
        }  

    }  
}
```

4. 写消费者：
 创建工程 - 创建连接  -创建通道 - 消费信息 - 关闭连接


```java
public class Consumer {  
  
    public static void main(String[] args) throws IOException {  
        //1. 创建工程  
  
        ConnectionFactory factory = new ConnectionFactory();  
        factory.setHost("localhost");  
        factory.setPort(5672);  
        factory.setUsername("guest");  
        factory.setPassword("guest");  
        factory.setVirtualHost("/");  
  
        //2. 创建连接  
        Connection connection = null;  
  
        try {  
            connection = factory.newConnection("消费者");  
            //3. 创建创建通道  
            Channel channel = connection.createChannel();  
  
            //4. 消费信息  
            channel.basicConsume("simple", true, new DeliverCallback() {  
                @Override  
                public void handle(String s, Delivery delivery) throws IOException {  
                    System.out.println("delivery" + new String(delivery.getBody(), "UTF-8"));  
                }  
            }, new CancelCallback() {  
                @Override  
                public void handle(String s) throws IOException {  
                    System.out.println("接受失败");  
                }  
            });  
            System.out.println("开始接受消息");  
  
            System.in.read();  
  
  
        } catch (IOException e) {  
            throw new RuntimeException(e);  
        } catch (TimeoutException e) {  
            throw new RuntimeException(e);  
        } finally {  
  
            //5. 关闭连接  
            if (connection != null) {  
                connection.close();  
            }  
        }  
  
  
    }  
}
```


## AMQP

生产者： 三次握手后建立连接，然后一次请求开启通道，发送信息， 四次挥手后关闭连接
消费者： 三次握手建立连接，开启信道，准备接受消息，发送确认，释放资源

为什么是Rabbitmq基于通道而不是连接来操作

1.  建立和维护 TCP/IP 连接需要消耗相当多的操作系统资源（如文件描述符、内存缓冲区）以及网络开销（三次握手、心跳维持等）。如果每个并发任务（比如一个线程发布消息，另一个线程消费消息）都需要一个独立的 TCP 连接，那么客户端和 RabbitMQ 服务器都会迅速耗尽资源，尤其是在高并发场景下。
	  通道是在单个 TCP 连接内部创建的虚拟连接（逻辑连接）。创建和销毁通道的开销非常小，几乎可以忽略不计。多个通道可以共享同一个 TCP 连接。
2. amqp 协议支持多通道
	- AMQP 协议帧需要在不同的逻辑流之间进行区分。通过为每个通道分配一个唯一的 ID，协议可以在单个 TCP 连接上传输属于不同通道的帧，并在接收端正确地将它们分派到对应的通道进行处理。这比为每个逻辑流建立单独的 TCP 连接要高效得多。
3. - **在单一连接上实现并发：** 应用程序通常是多线程或异步的。不同的线程/任务可能需要同时与 RabbitMQ 交互。如果直接使用连接，要么为每个线程创建一个连接（如上所述，资源消耗大），要么让所有线程共享一个连接，但这会导致操作串行化或需要复杂的锁机制来避免竞争条件，从而降低吞吐量。
     **通道提供并发隔离：** 通过为每个线程/任务分配一个独立的通道，这些任务可以在同一个 TCP 连接上并发地执行操作，而不会相互阻塞。每个通道都有自己的、独立的消息序列（例如，确认消息的 delivery tag 在通道内是唯一的）。这就像在一条高速公路（TCP 连接）上开辟了多个车道（通道），不同的车辆（操作）可以在各自的车道上独立行驶。

## Rabbitmq核心组件

![image.png](https://cdn.jsdelivr.net/gh/word1230/picture@main/resources/202504261051467.png)

1. 生产者
2. 消费者
3. 连接  ： 应用程序与Broker的网络连接 TCP/IP/ 三次握手和四次挥手
	一个连接可以有多个通道  
4. 通道  ：网络信道，几乎所有的操作都在Channel中进行
5. 交换机： 接受消息，根据路由键发送消息到绑定的队列
	一定会有一个交换机， 如果不设置就是默认交换机 
6. 路由键：是一个路由规则，虚拟机可以用它来确定如何路由一个特定消息。（发给谁）
7. 队列：保存消息并将它们转发给消费者
8. 虚拟节点： 起到隔离作用  
	一个虚拟主机理由可以有若干个Exhange和Queueu，同一个虚拟主机里面不能有相同名字的Exchange
9. 服务 breoker ： 就是一个Rabbitmq 服务 