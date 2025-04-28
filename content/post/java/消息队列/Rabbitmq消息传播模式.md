---
title: Rabbitmq消息传播模式
date: 2025-04-24T11:07:12+08:00
series:
  - 消息队列
series_weight: 4
categories:
  - 技术学习笔记
---
{{< series >}}

了解消息传播模式需要先理解交换机的类型
因为交换机是用于接收与转发消息的，不同的交换机转发消息的规则不同，而消息传播模式就是消息被如何转发的几种情况
因此可以说由于交换机有几种类型，所以产生了几种不同的消息传播模式
**如果选择了不同的交换机类型，就会产生不同的消息传播模式  **

## 交换机类型
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


## 各种模式详解

### 简单工作队列模式

这种模式也叫点对点模式

- 特点：
		只有一个消费者进行消费
		空交换机

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




### 工作队列模式

特点：
- 多个消费者
- 空交换机


- 对于消息有两种处理模式：
	1. 轮询（默认），一个消费者一条
	2. 公平， 根据消费者的消费能力分配给每个消费者不同数量的消息


>轮询模式的代码：

与简单队列模式唯一的区别是多了一个消费者

生产者：
```java
public class Producer {  
  
    public static void main(String[] args) throws IOException {  
        //1. 创建工厂  
  
        ConnectionFactory factory = new ConnectionFactory();  
  
        factory.setHost("localhost");  
        factory.setPort(5672);  
        factory.setUsername("guest");  
        factory.setPassword("guest");  
        factory.setVirtualHost("/");  
  
  
        //2. 创建连接  
       Connection connection = null;  
       try {  
           connection = factory.newConnection();  
           //3. 创建通道  
           Channel channel = connection.createChannel();  
  
           // 4. 创建交换机（不需要）  
  
           // 5. 创建队列  
           channel.queueDeclare("queue1", false, false, false, null);  
  
  
           //6.生产信息  
           for (int i = 0; i < 10; i++) {  
               String x = i +"";  
               channel.basicPublish("", "queue1", null, x.getBytes());  
           }  
  
  
  
       } catch (IOException e) {  
           throw new RuntimeException(e);  
       } catch (TimeoutException e) {  
           throw new RuntimeException(e);  
       }finally {  
           if (connection != null) {  
               connection.close();  
           }  
       }  
  
  
        //7. 关闭连接  
    }  
  
}
```

消费者1：
```java
public class Consumer {  
    public static void main(String[] args) throws IOException {  
        ConnectionFactory factory = new ConnectionFactory();  
  
        factory.setHost("localhost");  
        factory.setPort(5672);  
        factory.setVirtualHost("/");  
        factory.setUsername("guest");  
        factory.setPassword("guest");  
  
        Connection connection = null;  
        try{  
            connection = factory.newConnection();  
  
            Channel channel = connection.createChannel();  
  
            channel.basicConsume("queue1", true, new DeliverCallback() {  
                @Override  
                public void handle(String s, Delivery delivery) throws IOException {  
                    System.out.println("消费者1收到："+new String(delivery.getBody()));  
                }  
            }, new CancelCallback() {  
                @Override  
                public void handle(String s) throws IOException {  
                    System.out.println("cancelled");  
                }  
            });  
  
            System.out.println("Waiting for messages. To exit press CTRL+C");  
            System.in.read();  
  
  
        } catch (IOException e) {  
            throw new RuntimeException(e);  
        } catch (TimeoutException e) {  
            throw new RuntimeException(e);  
        }finally {  
            if (connection != null) {  
                connection.close();  
            }  
        }  
    }  
}
```
消费者2
```java
package com.cheems.work;  
  
import com.rabbitmq.client.*;  
  
import java.io.IOException;  
import java.util.concurrent.TimeoutException;  
  
public class Consumer2 {  
    public static void main(String[] args) throws IOException {  
        ConnectionFactory factory = new ConnectionFactory();  
  
        factory.setHost("localhost");  
        factory.setPort(5672);  
        factory.setVirtualHost("/");  
        factory.setUsername("guest");  
        factory.setPassword("guest");  
  
        Connection connection = null;  
        try{  
            connection = factory.newConnection();  
  
            Channel channel = connection.createChannel();  
  
            channel.basicConsume("queue1", true, new DeliverCallback() {  
                @Override  
                public void handle(String s, Delivery delivery) throws IOException {  
                    System.out.println("消费者2收到："+new String(delivery.getBody()));  
                }  
            }, new CancelCallback() {  
                @Override  
                public void handle(String s) throws IOException {  
                    System.out.println("cancelled");  
                }  
            });  
  
            System.out.println("Waiting for messages. To exit press CTRL+C");  
            System.in.read();  
  
  
        } catch (IOException e) {  
            throw new RuntimeException(e);  
        } catch (TimeoutException e) {  
            throw new RuntimeException(e);  
        }finally {  
            if (connection != null) {  
                connection.close();  
            }  
        }  
    }  
}
```

结果：
消费者1 ： 1 3  5 7 9
消费者2： 2 4 6 8 10


>公平模式的代码

实现公平模式是指：
通过设置prefetch_count =1 ,让Rabbitmq每次都只给一个消费者发送一个消息，当他处理完并手动确认后，才给他发送下一个，从而实现能者多劳

- 代码：

消费者设置每次只能拿到一个消息，同时设置手动确认

生产者不变

消费者1：
```java

public class Consumer {  
    public static void main(String[] args) throws IOException {  
        ConnectionFactory factory = new ConnectionFactory();  
  
        factory.setHost("localhost");  
        factory.setPort(5672);  
        factory.setVirtualHost("/");  
        factory.setUsername("guest");  
        factory.setPassword("guest");  
  
        Connection connection = null;  
        try{  
            connection = factory.newConnection();  
  
            Channel channel = connection.createChannel();  
  
  
            //设定每次分发的消息数量为1  
            int prefetch_count =1;  
            channel.basicQos(prefetch_count);  
  
            //关闭自动确认  
            channel.basicConsume("queue1", false, new DeliverCallback() {  
                @Override  
                public void handle(String s, Delivery delivery) throws IOException {  
                    System.out.println("消费者1收到："+new String(delivery.getBody()));  
                    //手动确认  
                channel.basicAck(delivery.getEnvelope().getDeliveryTag(), false);  
                }  
            }, new CancelCallback() {  
                @Override  
                public void handle(String s) throws IOException {  
                    System.out.println("cancelled");  
                }  
            });  
  
            System.out.println("Waiting for messages. To exit press CTRL+C");  
            System.in.read();  
  
        } catch (IOException e) {  
            throw new RuntimeException(e);  
        } catch (TimeoutException e) {  
            throw new RuntimeException(e);  
        }finally {  
            if (connection != null) {  
                connection.close();  
            }  
        }  
    }  
}
```

消费者2：
```java

  
public class Consumer2 {  
    public static void main(String[] args) throws IOException {  
        ConnectionFactory factory = new ConnectionFactory();  
  
        factory.setHost("localhost");  
        factory.setPort(5672);  
        factory.setVirtualHost("/");  
        factory.setUsername("guest");  
        factory.setPassword("guest");  
  
        Connection connection = null;  
        try{  
            connection = factory.newConnection();  
  
            Channel channel = connection.createChannel();  
  
            channel.basicQos(1);  
  
            channel.basicConsume("queue1", false, new DeliverCallback() {  
                @Override  
                public void handle(String s, Delivery delivery) throws IOException {  
                    System.out.println("消费者2收到："+new String(delivery.getBody()));  
                    try {  
                        Thread.sleep(3000);  
                    } catch (InterruptedException e) {  
                        throw new RuntimeException(e);  
                    }  
                    channel.basicAck(delivery.getEnvelope().getDeliveryTag(), false);  
  
                }  
            }, new CancelCallback() {  
                @Override  
                public void handle(String s) throws IOException {  
                    System.out.println("cancelled");  
                }  
            });  
  
            System.out.println("Waiting for messages. To exit press CTRL+C");  
            System.in.read();  
  
  
        } catch (IOException e) {  
            throw new RuntimeException(e);  
        } catch (TimeoutException e) {  
            throw new RuntimeException(e);  
        }finally {  
            if (connection != null) {  
                connection.close();  
            }  
        }  
    }  
}
```

结果： 消费者2 只收到一个消息




### 发布订阅模式


> 特点
- 所有消费者都会收到消息
- 多个消费者
- 使用fanout交换机
- **有多个队列**（因此队列由消费者创建）


> 代码

比队列模式的轮询方式的代码 多了 设置==交换机并将交换机与队列绑定==这一步

- 生产者
只需要生产信息， 交换机与队列都交给消费者来创建
第二个参数为： 队列名称/路由key ，发布订阅模式的路由key不生效为空
`channel.basicPublish("exchange1","",null,"hello world".getBytes());`

```java
package com.cheems.fanout;  
  
import com.rabbitmq.client.Channel;  
import com.rabbitmq.client.Connection;  
import com.rabbitmq.client.ConnectionFactory;  
  
import java.io.IOException;  
import java.util.concurrent.TimeoutException;  
  
public class Producer {  
    public static void main(String[] args) throws IOException {  
        ConnectionFactory factory = new ConnectionFactory();  
        factory.setHost("localhost");  
        factory.setPort(5672);  
        factory.setUsername("guest");  
        factory.setPassword("guest");  
        factory.setVirtualHost("/");  
  
        Connection connection = null;  
        try{  
            connection = factory.newConnection();  
  
            Channel channel = connection.createChannel();  
  
  
  
            //生产者的队列设为空  
            channel.basicPublish("exchange1","",null,"hello world".getBytes());  
  
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

- 消费者1/2

增加了构建交换机与队列的代码

`channel.exchangeDeclare("exchange1", "fanout");  
第一个参数为：交换机名称， 第二个参数为交换机类型
  
`channel.queueDeclare("queue1", true, false, false, null);  
  
`channel.queueBind("queue1", "exchange1", "");
第一个参数： 队列名， 第二个参数交换机名， 第三个参数路由key  `


```java
public class Consumer {  
  
    public static void main(String[] args) throws IOException {  
  
        ConnectionFactory factory = new ConnectionFactory();  
        factory.setHost("localhost");  
        factory.setPort(5672);  
        factory.setVirtualHost("/");  
        factory.setUsername("guest");  
        factory.setPassword("guest");  
  
        Connection connection = null;  
        try{  
            connection = factory.newConnection();  
  
            Channel channel = connection.createChannel();  
  
            channel.exchangeDeclare("exchange1", "fanout");  
  
            channel.queueDeclare("queue1", true, false, false, null);  
  
            channel.queueBind("queue1", "exchange1", "");  
  
  
            DeliverCallback deliverCallback = (consumerTag, delivery) -> {  
                String message = new String(delivery.getBody(), "UTF-8");  
                System.out.println("2号Received: " + message);  
            };  
  
  
            channel.basicConsume("queue1",true,deliverCallback,consumerTag -> {  
                System.out.println("失败");  
            });  
  
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



结果： 两个消费者都收到了消息


### 路由模式

> 特点
- 交换机根据消息的路由key     将消息转发到    与交换机绑定的队列的路由key相同的队列，从而转发给不同的消费者
- 使用direct交换机

>代码

- 在生产时给消息加上路由key
	`channel.basicPublish("direct","xxx",null,"hello world".getBytes());`
	路由key 为xxx

- 在交换机与队列绑定时增加路由key
- 交换机设定为direct类型
	`channel.exchangeDeclare("direct", "direct");`  
	设定交换机为direct
	`channel.queueDeclare("queue1", false, false, false, null); `   
	`channel.queueBind("queue1", "direct", "xxx");`
	consumer设定路由key为xxx
	`channel.queueBind("queue2", "direct", "aaa");`
	consumer2设定路由key为aaa
这样只有consumer1 能收到消息
其他代码不变


- 生产者
```java
package com.cheems.routing;  
  
import com.rabbitmq.client.Channel;  
import com.rabbitmq.client.Connection;  
import com.rabbitmq.client.ConnectionFactory;  
  
import java.io.IOException;  
import java.util.concurrent.TimeoutException;  
  
public class Producer {  
    public static void main(String[] args) throws IOException {  
        ConnectionFactory factory = new ConnectionFactory();  
        factory.setHost("localhost");  
        factory.setPort(5672);  
        factory.setUsername("guest");  
        factory.setPassword("guest");  
        factory.setVirtualHost("/");  
  
        Connection connection = null;  
        try{  
            connection = factory.newConnection();  
  
            Channel channel = connection.createChannel();  
  
            // 创建交换机,创建队列， 将交换机与队列绑定  
  
            //生产者的队列设为空  
            channel.basicPublish("direct","xxx",null,"hello world".getBytes());  
  
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
- 消费者1/2
```java

public class Consumer {  
  
    public static void main(String[] args) throws IOException {  
  
        ConnectionFactory factory = new ConnectionFactory();  
        factory.setHost("localhost");  
        factory.setPort(5672);  
        factory.setVirtualHost("/");  
        factory.setUsername("guest");  
        factory.setPassword("guest");  
  
        Connection connection = null;  
        try{  
            connection = factory.newConnection();  
  
            Channel channel = connection.createChannel();  
  
            channel.exchangeDeclare("direct", "direct");  
  
            channel.queueDeclare("queue1", false, false, false, null);  
  
            channel.queueBind("queue1", "direct", "xxx");  
  
  
            DeliverCallback deliverCallback = (consumerTag, delivery) -> {  
                String message = new String(delivery.getBody(), "UTF-8");  
                System.out.println("1号Received: " + message);  
            };  
  
  
            channel.basicConsume("queue1",true,deliverCallback,consumerTag -> {  
                System.out.println("失败");  
            });  
  
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

>结果：

只有1收到了




### 主题模式

>特点
- 增加了模糊路由key的机制，让路由key可以使用 # . \* 三种符号匹配
- 使用topic 交换机

\# : 0,1,多个
\ * ：匹配一个
. ： 代表分隔


> 代码

1. 在消息生产时将路由key 修改为携带三种符号的
	`channel.basicPublish("topic","com.xxx.111",null,"hello world".getBytes());`
2. 将交换机修改为direct
3. 绑定时将路由key 修改为携带三种符号的
		`channel.exchangeDeclare("topic", "topic");  `
	  `channel.queueDeclare("queue1", false, false, false, null); ` 
	  `channel.queueBind("queue1", "topic", "*.111");`
	
		channel.queueBind("queue2", "topic", "#.111");
		

只有第二个可以匹配到了

- 生产者
```java
public class Producer {  
    public static void main(String[] args) throws IOException {  
        ConnectionFactory factory = new ConnectionFactory();  
        factory.setHost("localhost");  
        factory.setPort(5672);  
        factory.setUsername("guest");  
        factory.setPassword("guest");  
        factory.setVirtualHost("/");  
  
        Connection connection = null;  
        try{  
            connection = factory.newConnection();  
  
            Channel channel = connection.createChannel();  
  
            // 创建交换机,创建队列， 将交换机与队列绑定  
  
  
  
            //生产者的队列设为空  
            channel.basicPublish("topic","xxx.111",null,"hello world".getBytes());  
  
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
- 消费者
```java
public class Consumer {  
  
    public static void main(String[] args) throws IOException {  
  
        ConnectionFactory factory = new ConnectionFactory();  
        factory.setHost("localhost");  
        factory.setPort(5672);  
        factory.setVirtualHost("/");  
        factory.setUsername("guest");  
        factory.setPassword("guest");  
  
        Connection connection = null;  
        try{  
            connection = factory.newConnection();  
  
            Channel channel = connection.createChannel();  
  
            channel.exchangeDeclare("topic", "topic");  
  
            channel.queueDeclare("queue1", false, false, false, null);  
  
            channel.queueBind("queue1", "topic", "*.111");  
  
  
            DeliverCallback deliverCallback = (consumerTag, delivery) -> {  
                String message = new String(delivery.getBody(), "UTF-8");  
                System.out.println("1号Received: " + message);  
            };  
  
  
            channel.basicConsume("queue1",true,deliverCallback,consumerTag -> {  
                System.out.println("失败");  
            });  
  
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


> 结果

都匹配都可以收到
一方匹配，一方收到

### 模式总结
可以发现

- 实际上简单工作队列模式是工作队列模式的特例，只有一个消费者，所以无论是轮询还是公平分配，都是这个消费者。 之所以会这样是因为**交换机都是空交换机**
- 从发布订阅到主题模式这三种，是依次增加功能
	- 发布订阅是发送给所有
	- 路由在这个基础上增加了routekey 这一匹配条件
	- 主题模式除了routekey ，又增加了匹配规则


