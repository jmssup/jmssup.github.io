---
title: "구조체 (struct), 약간의 메크로 얘기"
date: "2026-01-05"
---

## 개념

구조체 선언 및 사용법은 다른 언어들과 거의 동일하다.

상속은 불가능하며 Trait이라는 개념을 사용

필드 초기화 축약법 (field init shorthand) 사용가능

구조체 업데이트 문법 (struct update syntax) 사용가능

특정 필드만 따로 적고 ..기존인스턴스이름 을 작성하여 업데이트가 가능하다는 것 (소유권 옮겨질 가능성이 높은 것에 유의해야함)

튜플 구조체 (tuple structs) 도 지원. 튜플 구조체는 구조체 자체에는 이름을 지어 의미를 주지만 이를 구성하는 필드에는 이름을 붙이지 않고 타입만 적어 넣은 형태

유사 유닛 구조체 (unit-like structs) 필드가 아예 없는 구조체, 함수만 구현하거나 제네릭 인자로 활용하여 다른 struct의 함수 동작을 제어 가능하게 한다.

참조자를 필드 내 데이터로 정의하여 소유권 없는 데이터를 받을 수 있지만 라이프타임을 활용해 구조체 내부의 참조자 데이터가 유효함을 보장해야함 (라이프타임은 나중에 작성)

구조체는 그냥 정의를 하면 println! 종류의 출력 메크로에서 {} 에 대응되는 Display 트레잇으로의 자동변환이 되지 않는다.

다만 {:?}, {:\#?} 형식에 대응되는 Debug 트레잇으로는 변환이되며 내부 필드값을 모두 보여준다.

구조체 정의 바로 이전에 \#\[derive(Debug)\] 외부 속성 (outer attribute) 을 작성하면 println! 함수에서 {:?}로 {} 안에 :? 라는 디버그를 하겠다는 표시에 대하여 구조체에 명시적인 동의를 작성한 것이된다.

debug 트레잇에 대하여 dbg! 메크로를 사용하면 출력가능하다고 한다.

구조체에 함수를 정의하기 위해서는 impl 구조체이름 { 함수정의 } 로 함수를 정의한다.

구조체에 정의된 함수의 첫번째 매개변수는 &amp;self 이다.

self 는 self:Self 의 축약으로 Self는 impl 뒤에 적히는 타입에 대한 별명이라고 보면 된다.

함수의 매개변수는 소유권을 가져오거나 참조하거나 하는 행위들이 가능하기에 만약 &amp;self가 아닌 그냥 self가 되면 해당 함수 호출이후 인스턴스(객체)가 소멸하게 된다.

필드의 이름과 구조체 내부 함수의 이름이 같아도 된다. ()가 붙고 안붙고로 필드인지 함수인지 구분한다.

인스턴스의 함수에 접근하는 self의 타입이 &amp;, &amp;mut 등에 따라서 기존 인스턴스의 타입을 명시적으로 바꿔줘야 하는지 의문점이 생길 수 있다.

rust에서는 이를 자동 참조 및 역참조 시스템으로 지원한다. 함수에서 self의 참조, mut 여부가 명시적으로 적혀있기에 이에 맞춰서 해석한다는 것이다.

함수의 매개변수를 늘리는 것은 기존과 동일, rust의 함수는 가변인자를 받을 수가 없다. 오버로딩도 불가능, 이는 아래에 찾아 정리해놓은 메크로가 가능하다.

self를 첫 매개변수로 받지않는 함수도 정의 가능하다.

이렇게 정의하게 되면 해당 스코프에 접근하여 해당 함수를 직접적으로 호출해야한다. (String::from() 처럼)

impl 블록은 여러개 만드는게 가능하다. 이는 나중에 얘기할 제네릭과 연관해서 사용된다.

## 동작 원리

아래는 위에 적은 내용에 대한 예시 코드들을 총망라해놓은 것.

```rust
fn main() {
    let mut user1 = User {
        active: true,
        username: String::from("someusername123"),
        email: String::from("someone@example.com"),
        sign_in_count: 1,
    };

    user1.email = String::from("anotheremail@example.com");

    // sturct update syntax
    let user2 = User {
        email: String::from("another@example.com"),
        ..user1
    };

    let user2 = User {
        active: user1.active,
        username: user2.username, //String 이기에 복사가 아닌 이동이 일어남
        email: String::from("another@example.com"),
        sign_in_count: user1.sign_in_count,
    };
    
    let black = Color(0, 0, 0); //만약 함수에서 parameter로 Color를 받는데 Point를 넘겨주면 컴파일 에러
    let origin = Point(0, 0, 0);

    let subject = AlwaysEqual; //unit-like struct,

    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };

    if rect1.width() {
        println!("The rectangle has a nonzero width; it is {}", rect1.width);
    }

    
}

struct Color(i32, i32, i32); //tuple structs
struct Point(i32, i32, i32); //tuple structs
struct AlwaysEqual; //unit-like struct

fn build_user(email: String, username: String) -> User {
    User {
        active: true,
        username, //field init shorthand
        email,
        sign_in_count: 1,
    }
}

struct User {
    active: bool,
    username: String,
    email: String,
    sign_in_count: u64,
}

#[derive(Debug)]  //derive 어노테이션, 자동으로 trait 구현
struct Rectangle { //fields
    width: u32,
    height: u32,
}

impl Rectangle { //method
    fn area(&self) -> u32 {
        self.width * self.height
    }

    fn width(&self) -> bool {
        self.width > 0
    }

     fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }
}
impl Rectangle { //associated function
    fn square(size: u32) -> Self {
        Self {
            width: size,
            height: size,
        }
    }
}
```

dbg! 관련 자료를 보다가 메크로 관련한 궁금증들이 생겨서 따로 찾아보고 정리한다.

macro\_rules! 이름 { 패턴 =&gt; { 코드 } } 형태로 작성

함수는 값을 주고 받으며 동작하지만 메크로는 토큰(Token, 코드 조각) 을 주고 받으며 동작, 그래서 가변 인자 처리가 가능하다.

매크로 정의에서 \$는 매크로 시스템이 인식하는 **특수 변수**임을 나타낸다.

**\$name:designator**: 매크로 인자를 정의

\$arg:tt: **Token Tree,** 가장 유연하며 무엇이든(문자, 기호, 괄호 등) 다 받는다. (print!에서 사용)

\$val:expr: **Expression,** 1 + 2나 함수 호출 같은 식(Expression)을 받는다. (dbg!에서 사용)

**\$( ... )\* (반복)**: \$ 뒤의 괄호 안에 있는 패턴이 0번 이상 반복됨을 의미한다.

ex) \$(\$arg:tt)\*: "어떤 토큰이든 개수에 상관없이 다 받겠다"는 뜻이다.

```rust
macro_rules! print {
    ($($arg:tt)*) => {
        $crate::io::_print($crate::format_args!($($arg)*));
    };
}

macro_rules! println {
    () => {
        $crate::print!("\n")
    };
    ($($arg:tt)*) => {
        $crate::io::_print($crate::format_args_nl!($($arg)*));
    };
}
```

### 메크로와 함수, 요약 비교

| 구분 | 일반 함수 (fn) | 선언적 매크로 (macro\_rules!) |
| --- | --- | --- |
| **호출 시점** | 런타임 (프로그램 실행 중) | 컴파일 타임 (빌드 중 코드 치환) |
| **인자 개수** | 고정됨 | 가변적 (\*, \+ 반복 사용) |
| **타입 검사** | 매개변수 타입이 엄격히 일치해야 함 | 패턴 매칭을 통해 유연하게 대응 가능 |
| **특이사항** | 오버로딩 불가 | 오버로딩과 유사한 효과 가능 |

메크로가 함수의 상위호환 처럼 보이지만 함수는 메모리상에서 함수의 코드부분으로 이동하여 해당 함수의 코드를 읽으며 작동하지만 메크로는 메크로의 코드를 기존 메크로 호출부에 복사 붙여넣기 과정을 하는 것이기에 컴파일 속도, 런타임의 속도, 디버깅 등에서 여러 차이가 발생한다.

## 관련 개념

## 참고자료

- [Tistory 원문](https://myinfosub.tistory.com/79)
