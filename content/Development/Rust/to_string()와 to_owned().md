---
title: "to_string()와 to_owned()"
date: "2026-07-24"
---

## 개념

to\_string과 to\_owned 두 함수 모두 &amp;str을 String 으로 변환하기 위해 사용하는 코드들을 보면서 왜 어느 때에는 to\_string을 사용하고 어느 때에는 to\_owned를 사용하는지, 무슨 차이가 있는지 궁금해져서 정리하게 되었다.

일단 결론부터 말하자면 옛날에는 &amp;str을 대상으로 String으로 변환하는 과정에서 to\_string이 to\_owned보다 느린 과정으로 동작하여 to\_owned를 사용했다고 한다.

다만 현대에 이르러서는 최적화를 통해 &amp;str이 to\_string 호출시 to\_owned를 호출하는 식으로 바뀌어 있어 사실상 효율이 같다고 보는게 맞다고 한다.

-&gt; &amp;str에 대하여 String으로 변환 시 to\_owned만 사용하면 될 것 같다.

## 동작 원리

그러면 두 함수 자체의 차이를 얘기해보자면

to\_string은 Dispaly Trait에 종속되어 있는 ToString Trait을 통하여 사용되는 함수로 Display Trait 구현이 강제된다.

또한 T -&gt; String 구조로 다양한 타입에 대하여 String으로만 반환하는 함수이다.

to\_owned의 경우에는 ToOwned Trait을 구현하여 사용가능한 함수로 객체 -&gt; 소유권이 있는 객체 로 반환해주는 함수이다.

그렇다 보니 ToOwned를 구현할 때 내부적으로 해당 객체의 타입에 대하여 Borrow(빌림)가 구현되어 있어야 구현 가능하다.

## 관련 개념

## 참고자료

참고 블로그: [https://velog.io/@autumnsky1562/Rust-tostring-대신-toowned를-사용해야-하는-이유](https://velog.io/@autumnsky1562/Rust-tostring-%EB%8C%80%EC%8B%A0-toowned%EB%A5%BC-%EC%82%AC%EC%9A%A9%ED%95%B4%EC%95%BC-%ED%95%98%EB%8A%94-%EC%9D%B4%EC%9C%A0)

참고 영상: [https://www.youtube.com/watch?v=3iC3FVS6UXQ&amp;start=125](https://www.youtube.com/watch?v=3iC3FVS6UXQ&start=125)

- [Tistory 원문](https://myinfosub.tistory.com/132)
