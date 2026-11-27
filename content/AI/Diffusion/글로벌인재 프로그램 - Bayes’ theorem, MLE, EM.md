---
title: "[글로벌인재 프로그램] Bayes’ theorem, MLE, EM"
date: "2026-08-02"
---

## 수업 내용

나는 이번 글로벌인재 프로그램에서 수학적으로 엄청나게 깊은 지식이 아닌 필요한만큼의 지식들을 빠르게 익히고 최종 목표와 미니프로젝트에 대한 적절한 결과를 내고자 한다. 그렇다 보니 내용이 좀 부족할 수 있다. 또한 원래 내가 그렇게 세세하게 공부한 내용을 적지 않기도 해서 부족해 보일 수 있다.

### Bayes' theorem

어떠한 모델을 학습시킨다는 것은 그 모델이 가지는 예측확률을 최대화 시키는 것을 의미한다. 이를 위해서 베이즈 정리를 알 필요가 있다.

조건부 확률에 대한 공식, 매우 간단하다. 다음의 공식이다.

![\[글로벌인재 프로그램\] Bayes’ theorem, MLE, EM의 참고 이미지](https://blog.kakaocdn.net/dna/cmPIAN/dJMcafguRZf/AAAAAAAAAAAAAAAAAAAAAObjcB-dUYmzm02RNmEM4eifngkxVDjZzopkDA-i7aId/img.png)

확률에 대한 공부를 하면 바로 접하게 되는 공식 중 하나이다.

머신러닝에서 이 베이즈이론이 중요한 이유는 학습에 관한 연산에 직접적으로 관여하기 때문이다.

A를 예측에 필요한 파라미터들, B를 데이터셋이라 하면 아래처럼 정리 가능하다.

P(A\|B): Posterior / Typical goal, tricky, try Bayes

p(B\|A): Likelihood / Tractable, well defined

P(A): Prior / Domain knowledge

P(B): Evidence / Approximate with large data

이 P(A\|B)를 위한 파라미터(가중치) 값을 최대한 높이기 위하여 우리는 P(B\|A)를 최대화 시키는 과정이 필요하다.

이를 위해 아래의 MLE가 필요하게 된다.

추가로 위의 식에 log를 대입하면 곱샘식이 아닌 덧셈식으로 간편하게 만드는게 가능하다. 이는 이후에 중요하게 사용된다.

### MLE (Maximum likelihood estimation)

위에서 얘기했듯 우리는 모델의 Likelihood를 최대화 시켜야 한다.

이를 위해서는 다음의 두 식을 알면 된다.

![\[글로벌인재 프로그램\] Bayes’ theorem, MLE, EM의 참고 이미지](https://blog.kakaocdn.net/dna/crybgL/dJMcafOnuNV/AAAAAAAAAAAAAAAAAAAAAA2Ws0PLHAGwhyU9cPDHLWuAqq1flEl5oBZCK0q_rvuH/img.png)

![\[글로벌인재 프로그램\] Bayes’ theorem, MLE, EM의 참고 이미지](https://blog.kakaocdn.net/dna/bbrWER/dJMcahL40HO/AAAAAAAAAAAAAAAAAAAAAAI2HaLynaLJrFz6HonyaszkBLxtXUGrgy7-SeKvbu9q/img.png)

간단히 표현하자면 그냥 미분해서 0이 되는 지점을 찾는게 MLE이다.

파라미터 값이 존재할 때 이에 대한 각 데이터값들이 존재할 확률은 확률 분포로 표현 가능하며 이는 가우시안분포로 표현 가능하다.

이 가우시안 분포는 위로 볼록한 상태로 가장 높은 확률 지점에서 미분시 0이라는 값으로 귀결되기에 이를 찾는게 MLE이다.

![\[글로벌인재 프로그램\] Bayes’ theorem, MLE, EM의 참고 이미지](https://blog.kakaocdn.net/dna/b0OYZh/dJMcaaM0qit/AAAAAAAAAAAAAAAAAAAAAD7VfBthedJKzYNiVS-gyoVzmjaEF7vNs81RoWt7Nyyr/img.png)

확률 밀도 함수에 대한 미분 과정이기에 0을 구하는게 어렵지 않다.

복잡한 상태인 경우 경사하강법이나 다른 테크닉이 필요하긴 하다.

그러면 위의 베이즈 정리와 이 MLE를 합치면 어떻게 되겠는가.

이 합친 상태를 MAP라고 부르는데 아래의 식으로 보는게 가능하다.

![\[글로벌인재 프로그램\] Bayes’ theorem, MLE, EM의 참고 이미지](https://blog.kakaocdn.net/dna/oEtgl/dJMcabSCzg6/AAAAAAAAAAAAAAAAAAAAAHApLal3-jtjD5__EMsj-oQGnlhb6MDPJ3R2iw38EGnQ/img.png)

왜 분모를 제거가능하냐면 분모인 Evidence의 경우 상수 취급이 가능하기에 미분과정에서 삭제 가능하다.

이 식의 의미를 뜯어 얘기하자면 원래의 Likelihood에만 미분을 적용시키는 과정은 최대화는 가능하지만, 이는 과적합으로 이어지게 된다.

이를 위해 베이즈 정리 전체에 파라미터에 대한 미분을 적용시키게 되면 Prior 값에 의해 likelihood와 prior의 값이 적절히 결합하여 과적합이 완화되게 된다.

이 과정에 log를 붙이게 되면 덧셈과정으로 간략화 하는게 가능하며, 아래의 식 처럼 흔히 머신러닝, 딥러닝에서 사용하는 손실함수와 정규화의 관계가 보임을 알 수 있다.

![\[글로벌인재 프로그램\] Bayes’ theorem, MLE, EM의 참고 이미지](https://blog.kakaocdn.net/dna/EnEgK/dJMcabyjh4U/AAAAAAAAAAAAAAAAAAAAAAcIWt6Fwrh3txJz547SPzDCPIKnpBmejmdXVPCsSpNI/img.png)

지금까지는 파라미터와 데이터셋이 하나인 경우에 대하여 진행하였다.

그런데 현실은 하나의 조건에 하나의 데이터셋으로 이루어져 있는 문제는 많지 않기에 이 파라미터가 여러개이며 데이터셋도 여러개인 경우 어떻게 최대화가 진행되겠는지 고민할 필요가 있다.

위의 단일 파라미터, 데이터셋으로 진행한 과정은 3차원 그림에서 가우시안 분포가 하나 존재하며 이 분포의 최대 부분을 미분시 0인점을 이용하여 찾는 과정으로 얘기 가능하지만 여러개의 파라미터, 여러개의 데이터셋인 경우 여러개의 가우시안 분포가 존재하며 이 가우시안 분포들이 여러개 라는 것은 미분시 0인 지점이 최대 확률인 지점(위로 볼록)이 아닌 반대의 경우 혹은 복합적인 상태로 기울기가 0인 경우가 생길 수 있다.

또한 데이터셋 1번으로 1번 가우시안 분포의 최대 높이로 도달해야 하는데 이 소속 정보는 우리가 모르는 정보이기에 좀 더 복잡해진다.

이를 위해 EM이 필요하게 된다.

다음 글에 이어서..

## 예제와 실습

## 질문

## 관련 개념

## 참고자료

- [Tistory 원문](https://myinfosub.tistory.com/140)
