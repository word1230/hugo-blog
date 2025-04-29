---
title: Springboot集成rabbitmq
date: 2025-04-28T20:46:40+08:00
draft: true
categories:
  - 技术学习笔记
series:
  - 消息队列
series_weight: 5
---
{{< series >}}

## fanout模式

1. 导包 
```
<dependency>  
    <groupId>org.springframework.boot</groupId>  
    <artifactId>spring-boot-starter-amqp</artifactId>  
</dependency>  
<dependency>  
    <groupId>org.springframework.boot</groupId>  
    <artifactId>spring-boot-starter-web</artifactId>  
</dependency>
```
2. 写一个生产消息的服务
```java
  
@Component  
public class Producer {  
//导的包里自带的类
    @Autowired  
    private RabbitTemplate rabbitTemplate;  
  
  //与之前的参数一致
    public void sendMessage(String message) {  
        rabbitTemplate.convertAndSend("fanoutexchange", "", message);  
    }  
}
```

3. 写配置类（只要有一个就行）
创建一些对象交给容器管理
```java
@Configuration  
public class RabbitMqConfig {  
    @Bean  
    public Queue emailqueue(){  
        return new Queue("emailqueue",true,false,false);  
    }  
    @Bean  
    public Queue wechatqueue(){  
        return new Queue("wechatqueue",true,false,false);  
    }  
  
    @Bean  
    public Exchange fanoutexchange(){  
        return new FanoutExchange("fanoutexchange",true,false);  
    }  
  
    @Bean  
    public Binding bindingwechat(){  
        return BindingBuilder.bind(wechatqueue()).to(fanoutexchange()).with("").noargs();  
    }  
    @Bean  
    public Binding bindingemail(){  
        return BindingBuilder.bind(emailqueue()).to(fanoutexchange()).with("").noargs();  
    }  
}
```

4. 消费者

```java
@Component  
@RabbitListener(queues = "emailqueue")  
public class EmailConsumer {  
  
  
  
    @RabbitHandler  
    public void  consumerMessage(String msg){  
        System.out.println("email-------->"+msg);  
    }  
  
}
```

消费者2
```java
@Component  
@RabbitListener(queues = "wechatqueue")  
public class WechatConsumer {  
  
    @RabbitHandler  
    public void receive(String message) {  
        System.out.println("wechat ------>"+message);  
    }  
}
```

5. 测试

## routing 模式

1. 将配置类中的交换机换成direct,并在绑定时添加routingkey
```java
@Bean  
public Exchange directExchange(){  
    return new DirectExchange("directExchange",true,false);  
}  
  
@Bean  
public Binding bindingwechat(){  
    return BindingBuilder.bind(wechatqueue()).to(directExchange()).with("aaa").noargs();  
}
```
2. 生成消息的参数增加路由键

```java
rabbitTemplate.convertAndSend("directExchange", "aaa", message);
```


其他不用更改

## topic模式

将上述的改动中的routingkey 改为可模糊匹配的routingkey
`rabbitTemplate.convertAndSend("topicExchange", "com.123.111", message);`
将交换机类型换成topic

```java
@Bean  
public Exchange topicExchange(){  
    return new TopicExchange("topicExchange",true,false);  
}  
  
@Bean  
public Binding bindingwechat(){  
    return BindingBuilder.bind(wechatqueue()).to(topicExchange()).with("*.111").noargs();  
}  
@Bean  
public Binding bindingemail(){  
    return BindingBuilder.bind(emailqueue()).to(topicExchange()).with("#.111").noargs();  
}
```

## 工作队列模式

工作队列模式只有一个队列，没有交换机，所以注册一个队列
两个消费者共用一个队列

> 轮询
1. 生产方法

`rabbitTemplate.convertAndSend("", "emailqueue", message);`

2. 配置类

只有这个（当然也可以注册多个队列，所有消费者绑定一个队列，也可以）
```java
@Bean  
public Queue emailqueue(){  
    return new Queue("emailqueue",true,false,false);  
}
```

3. 消费者的队列绑定这个队列
```java
@Component  
@RabbitListener(queues = "emailqueue")  
public class EmailConsumer {  
  
  
  
    @RabbitHandler  
    public void  consumerMessage(String msg){  
        System.out.println("email-------->"+msg);  
    }  
  
}


```

```java
@Component  
@RabbitListener(queues = "emailqueue")  
public class WechatConsumer {  
  
    @RabbitHandler  
    public void receive(String message) {  
        System.out.println("wechat ------>"+message);  
    }  
}
```

> 公平分配

1. 在Application.yml文件中设置消费者每次只能接受一条信息，并将消息确认设置为手动
```yml
  
spring:  
  rabbitmq:  
    host: localhost  
    port: 5672  
    username: guest  
    password: guest  
    virtual-host: /  
    listener:  
      simple:  
        prefetch: 1  
        acknowledge-mode: manual
```
2. 在消费者设定手动确认
引入delivery tag 与channel进行手动确认
```java
@Component  
@RabbitListener(queues = "fairqueue")  
public class Consumer1 {  
  
    @RabbitHandler  
    public void consumer1(String message, Channel channel, @Header(AmqpHeaders.DELIVERY_TAG)long tag) throws IOException {  
        System.out.println("消费者1："+message);  
        channel.basicAck(tag,false);  
    }  
  
}
```


