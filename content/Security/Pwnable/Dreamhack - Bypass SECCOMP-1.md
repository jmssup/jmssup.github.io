---
title: "[Dreamhack] Bypass SECCOMP-1"
date: "2026-02-18"
---

## 개념

간단한 설명

SECCOMP에 대한 공부를 할 겸 문제를 풀어보았다.

문제 자체는 매우 쉽다. 문제 파일에서 제공하는 c 코드에 적혀있는 거부된 시스템콜이 아닌 다른 우회 가능한 시스템 콜을 찾으면 된다.

SECCOMP에 대하여 공부하기 위해 푼 문제인 만큼 SECCOMP를 간략하게 얘기하고자 한다.

SECCOMP는 sandbox 형태로 linux kernel 수준에서의 시스템 콜 필터링을 위해 사용되는 기술이다.

정확한 사용법은 찾아보면 나온다.

BPF(Berkeley Packet Filter) 에 직접적으로 필터링을 지시하여 특정 시스템 콜을 필터링하는 기술이라고 보면 된다.

## 동작 원리

## 관련 개념

## 참고자료

Dreamhack write-up

[https://dreamhack.io/wargame/writeups/43401](https://dreamhack.io/wargame/writeups/43401)

- [Tistory 원문](https://myinfosub.tistory.com/99)
