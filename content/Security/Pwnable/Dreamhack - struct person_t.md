---
title: "[Dreamhack] struct person_t"
date: "2026-06-28"
---

## 개념

struct가 stack에서 어떻게 저장되는지, canary leak, strip된 코드 분석 방법 등을 알면 금방 풀리는 문제이다.

문제를 풀면서 막혔던 부분들은 strip된 코드에서 어떻게 함수의 위치를 찾는지, struct가 저장될때는 struct에 선언한 변수 순서대로 stack의 낮은 주소에 저장된다는 점, 중간에 존재하는 int, double 형의 변수들에 어떻게 널바이트가 존재하지 않도록 하는지 등이 문제를 풀면서 공부하게 만든 부분이다.

## 동작 원리

## 관련 개념

## 참고자료

아래는 write-up 주소이다.

[https://dreamhack.io/wargame/writeups/47565](https://dreamhack.io/wargame/writeups/47565)

- [Tistory 원문](https://myinfosub.tistory.com/112)
