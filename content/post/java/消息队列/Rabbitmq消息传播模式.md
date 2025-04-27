---
title: Rabbitmq消息传播模式
date: 2025-04-24T11:07:12+08:00
series:
  - 消息队列
series_weight: 4
categories:
  - java
  - 消息队列
---
{{< series >}}

了解消息传播模式需要先理解交换机的类型
因为交换机是用于接收与转发消息的，不同的交换机转发消息的规则不同，而消息传播模式就是消息被如何转发的几种情况
因此可以说由于交换机有几种类型，所以产生了几种不同的消息传播模式
**如果选择了不同的交换机类型，就会产生不同的消息传播模式  **

# 交换机类型
有四种：
1. direct 直连  只有消息的routekey与队列的routekey一致才会转发给该队列
2. fanout 扇形  不处理routekey 将消息转发给所有绑定的队列
3. topic 主题   根据一定的规矩，根据routekey 把消息转发到符合规则的队列中
	\# 表示 0 ，1 ，多个
	. 表示 1个
4. headers 头部 根据消息的header来转发消息而不是routekey ，header是一个map，可以匹配其他类型

根据交换机类型可以得出的消息传播模式
1. 空交换机：
	1. 简单工作队列（Simple Work Queue）， 工作队列（Work Queues）
2. fanout 
	1. 发布订阅模式（Publish/Subscribe）
3. direct
	1. 路由模式（routing）
4. topic 
	1. 主题模式（ Topics）


# 各种模式详解

## 简单工作队列模式

这种模式也叫点对点模式

- 特点：
		只有一个消费者进行消费

- 代码：
生产者
```java

public class Producer {  
  
    public static void main(String[] args) throws IOException {  
  
        // 1. 构建工厂  设定主机，端口，用户名，密码，虚拟地址  
  
        ConnectionFactory factory = new ConnectionFactory();  
        factory.setHost("localhost");  
        factory.setPort(5672);  
        factory.setUsername("guest");  
        factory.setPassword("guest");  
        factory.setVirtualHost("/");  
  
        //2. 构建连接  
        Connection connection = null;  
        try{  
            connection = factory.newConnection("连接名");  
  
            //3. 构建通道  
            Channel channel = connection.createChannel();  
  
            //4. 构造交换机(简单模式不需要)  
  
            //5.构造队列  
            /*  
             *  如果队列不存在，则会创建  
             *  Rabbitmq不允许创建两个相同的队列名称，否则会报错。  
             *             *  @params1： queue 队列的名称  
             *  @params2： durable 队列是否持久化  
             *  @params3： exclusive 是否排他，即是否私有的，如果为true,会对当前队列加锁，其他的通道不能访问，并且连接自动关闭  
             *  @params4： autoDelete 是否自动删除，当最后一个消费者断开连接之后是否自动删除消息。  
             *  @params5： arguments 可以设置队列附加参数，设置队列的有效期，消息的最大长度，队列的消息生命周期等等。  
             * */            channel.queueDeclare("simple", false, false, false, null);  
  
            /*  
  
             @params1: 交换机exchange  
             @params2: 队列名称  
             @params3: 属性配置  
             @params4: 发送消息的内容  
             */  
            //6. 构造信息并发送  
            channel.basicPublish("", "simple", null, ("Hello World!").getBytes());  
        } catch (IOException e) {  
            throw new RuntimeException(e);  
        } catch (TimeoutException e) {  
            throw new RuntimeException(e);  
        }finally {  
            //7. 关闭连接  
            if(connection != null){  
                connection.close();  
            }  
        }  
    }  
  
}
```


消费者
```java
public class Consumer {  
    public static void main(String[] args) throws IOException {  
  
        //1. 构建工厂  
        ConnectionFactory factory = new ConnectionFactory();  
        factory.setHost("localhost");  
        factory.setPort(5672);  
        factory.setVirtualHost("/");  
        factory.setUsername("guest");  
        factory.setPassword("guest");  
  
        //2.构建连接  
        Connection connection = null;  
        try{  
            connection =factory.newConnection("连接名");  
            //3. 构建通道 （这里也可以建立队列和交换机， 消费者与生产者只需要一个完成了建立就可以）
            Channel channel = connection.createChannel();  
            //4. 消费信息  
            // 参数：1.队列名称 2.是否自动确认 3.接受消息的回调 4.消息接受失败处理函数  
            channel.basicConsume("simple", true, new DeliverCallback() {  
                @Override  
                public void handle(String s, Delivery delivery) throws IOException {  
                    System.out.println(new String(delivery.getBody()));  
                }  
            }, new CancelCallback() {  
                @Override  
                public void handle(String s) throws IOException {  
                    System.out.println("失败");  
                }  
            });  
            System.out.println("开始接受消息");  
            System.in.read();  
        } catch (IOException e) {  
            throw new RuntimeException(e);  
        } catch (TimeoutException e) {  
            throw new RuntimeException(e);  
        }finally {  
            if(connection != null){  
                connection.close();  
            }  
	}
    }  
}
```




## 工作队列模式

对于消息有两种处理模式





## 发布订阅模式


## 路由模式


## 主题模式



## 模式总结
可以发现

- 实际上简单工作队列模式是工作队列模式的特例，只有一个消费者，所以无论是轮询还是公平分配，都是这个消费者。 之所以会这样是因为**交换机都是空交换机**
- 从发布订阅到主题模式这三种，是依次增加功能
	- 发布订阅是发送给所有
	- 路由在这个基础上增加了routekey 这一匹配条件
	- 主题模式除了routekey ，又增加了匹配规则


