---
title: "SROP"
date: "2026-07-05"
---

## 개념

SROP (Sigreturn Oriented Programming)의 약자이다.

SROP를 진행하기 위해서는 간단한 user mode와 kernel mode 간의 mode change 과정과 signal 복귀 처리 과정에 대하여 알아야 한다.

프로그램이 실행되고 프로세스가 진행되면서 signal이 발생하면 signal이 끝나고 복구할 때를 위해 기존 register값들, signal frame을 user mode의 stack에 저장해놓는다. 이후 user mode에서 kernel mode로의 전환 과정이 생긴뒤 signal handling이 진행된다. signal handling이 끝나면 sigreturn 코드가 실행이 된다.

이 sigreturn 코드가 실행이 되면 signal frame을 이용하여 signal 이 호출되기 전의 register 상태를 복구하는 작업이 이뤄지는데 이 때 복구는 현재 rsp 위치를 기준으로 signal frame으로 해석하여 진행된다.

## 동작 원리

이 register 상태 복구 작업이 exploit 지점이 된다.

악성 사용자가 signal 호출시의 register 저장 구조, 프레임을 파악해둔 상태로 signal frame을 미리 세팅해둔다. 이후 BOF나 여타 취약점을 이용하여 **\[stack 값 조작 + rax 값 조작 + syscall 함수 호출 가능\]** 을 수행할 수 있다면 rax를 sigreturn 코드를 실행하는 15로 설 정하고 syscall 함수를 호출하도록 값을 배치한 뒤 가짜 signal frame을 이용하도록 만드는 것이 SROP의 exploit 구조이다.

## 관련 개념

## 참고자료

아래는 공부하며 찾아본 사이트들.

[https://doongdangdoongdangdong.tistory.com/48](https://doongdangdoongdangdong.tistory.com/48)

[https://powerco3e-lch.tistory.com/37](https://powerco3e-lch.tistory.com/37)

- [Tistory 원문](https://myinfosub.tistory.com/117)
