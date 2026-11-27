---
title: "Rust 시작하기"
date: "2026-01-01"
---

## 개념

rust 배워보기 시작

## 동작 원리

rust 설치를 위해서는

linux와 mac에서는 아래의 명령어를 사용하면 된다.

curl --proto '=https' --tlsv1.2 [https://sh.rustup.rs](https://sh.rustup.rs/) -sSf \| s

window는 공식 rust사이트에 가서 설치하면 된다.

rust 파일의 확장자명은 .rs이며 컴파일시에는 rustc \[파일 이름\] 으로 컴파일이 가능하다.

rust에는 cargo라는게 있다

cargo는 프로젝트 빌드용 프로그램으로 내부 파일들에 필요한 설정, 의존성 들을 작성하고 이를 토대로 쉽게 빌드 및 릴리즈를 할 수 있도록 도와준다.

cargo new - cargo.toml과 src 폴더 및 cargo를 통한 빌드에 필요한 파일을 포함시킨 작업폴더를 만든다.

cargo build - 컴파일 및 실행파일 생성까지 진행한다.

cargo run - 컴파일 및 실행을 동시에 진행한다.

cargo check - 컴파일만, 실행파일은 생성 하지 않는다.

cargo build --release - 릴리즈(배포)용 파일을 만든다. 이때는 일반 빌드와 다르게 컴파일시 더 많은 최적화가 발생한다.

## 관련 개념

## 참고자료

- [Tistory 원문](https://myinfosub.tistory.com/71)
