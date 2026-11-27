---
title: "Stack Pivoting"
date: "2026-03-01"
---

## 개념

Dreamhack의 워게임 문제를 풀다가 Stack Pivoting 이라는 개념을 알게 되었다.

코드상에서 버퍼오버플로우가 발생하여 return address에 접근은 가능한 상태지만 one-shot gadget이 존재하지는 않은게 문제의 핵심 이었다. 이 상황에서 어떻게 해결 가능한지를 찾아보다가 Stack Pivoting을 알게 되었다.

Stack Pivoting의 핵심은 sfp와 rbp의 작동과정을 이용하여 rsp값을 변조해 Fake Stack을 형성하는 것이다.

## 동작 원리

이 Fake Stack의 형성을 위해서는 대표적으로 leave; ret 가젯을 활용할 수 있다. 물론 이 leave; ret 외에도 rsp를 변조할 수 있는 가젯이면 응용가능하다.

내가 푼 문제상황에서는 return address 영역인 8바이트만 조작 가능한 상태였기에 leave; ret 를 이용하여 stack pivoting의 원리에 대하여 말하고자 한다.

stack의 형성 및 복구에는 sfp 값, rbp, rsp 가 사용된다.

stack이 형성될 때는 push rbp로 rbp를 저장하고(sfp 형성) rbp에 현재 rsp값을 저장한 뒤 필요한 공간만큼 rsp에 sub 연산이 진행된다.

push rbp

mov rbp, rsp

sub rsp, \[stack size\]

stack이 복구될 때는 leave; ret 과정이 수행되는데 이 과정은 현재 rsp를 rbp로 옮기고 rbp를 sfp에 저장된 이전 stack frame으로 복구한 뒤 rip도 return address로 복구한다.

mov rsp, rbp

pop rbp

pop rip

이러한 stack의 형성 및 복구 과정에 의해 공격자가 ROP 같은 공격에 사용할 stack공간이 모자라도 fake stack을 형성하여 더 많은 공격공간을 확보하는게 가능해진다.

이 때 보통 기존 stack 영역은 aslr로 address가 randomization되어 있는 경우가 보통이기에 기존의 stack 영역은 활용하지 못하고 .bss 영역과 같은 write 가능한 영역으로 fake stack을 형성하여 rop와 같은 다른 공격으로 활용한다.

sfp에 내가 형성하고자하는 fake stack의 위치를 적고 leave; ret가 return address에 작성하면 leave; ret 이후에 한번 더 leave; ret가 진행되게 되며 fake stack이 형성된다.

첫번째 leave; retmov rsp, rbp -&gt; rsp에 정상적인 rbp가 저장된다.pop rbp -&gt; 변조된 sfp 값이 rbp에 저장된다.

pop rip -&gt; 가짜 스택을 형성하기 위해 리턴 주소에 적어둔 leave; ret 가젯의 주소를 rip에 저장하고 해당 가젯으로 점프한다.

두번째 leave

mov rsp, rbp -&gt; rsp에 변조된 rbp 값이 저장된다.

pop rbp -&gt; Fake Stack의 최상단에 저장된 값을 rbp에 저장하고 rsp는 +8 바이트만큼 이동한다.

pop rip -&gt; rsp에 저장된 값을 rip에 저장한다. 이 rip가 이동하는 곳부터 rop chaining attack이 시작된다.

그래서 공격을 위해서는 미리 rop chain을 가짜스택에 작성해두고 rip가 작성한 가짜스택 rop chain 위치로 이동하게 한번 더 조작하면 공격에 성공하게 된다.

## 관련 개념

## 참고자료

- [Tistory 원문](https://myinfosub.tistory.com/102)
