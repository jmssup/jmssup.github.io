---
title: "PHP 기본 사용법"
date: "2025-06-30"
---

## 개념

PHP는 C언어 스타일의 문법을 따르며 객체 지향 프로그래밍을 지원합니다.

## 동작 원리

**PHP 기본 규칙**

- **PHP 태그:** PHP 코드는 &lt;?php ... ?&gt; 태그 안에 작성합니다.
- **기본 출력:** echo 함수로 텍스트, 변수, HTML 등을 출력할 수 있습니다

```php
<?php
echo "Hello, World!";
?>
```

**변수와 데이터 타입**

- **변수 선언:** \$변수명 = 값; 형태로 선언합니다.
- **데이터 타입:** 문자열(String), 정수(Integer), 실수(Float), 논리(Boolean), 배열(Array), 객체(Object), NULL, 리소스(Resource) 등 다양한 타입을 지원합니다.

```php
<?php
$name = "PHP";
$age = 30;
echo "안녕하세요, $name! 나이는 $age입니다.";
?>
```

**HTML과의 혼합 사용**

**PHP와 HTML을 한 파일에 섞어 사용할 수 있습니다.**

```php
<!DOCTYPE html>
<html>
<head>
    <title>PHP 예제</title>
</head>
<body>
    <?php echo "안녕하세요, PHP!"; ?>
</body>
</html>
```

기본 문법 및 제어 구조

- **조건문:** if, else, switch 등
- **반복문:** for, while, foreach 등
- **함수:** function 함수명() { ... } 형태로 정의

```php
<?php
function greet($name) {
    echo "안녕하세요, $name!";
}
greet("PHP");
?>
```

## 관련 개념

## 참고자료

- [Tistory 원문](https://myinfosub.tistory.com/27)
