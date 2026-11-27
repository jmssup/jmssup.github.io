---
title: "Android 운영체제에 대하여"
date: "2025-06-01"
---

## 개념

Android 운영체제는 Linux 커널 기반이다.

Linux 커널 기반이라는 것이 iOS와 대비되는 Android의 가장 큰 특징인 자유로움을 갖게 해준다.

하지만 Android 운영체제와 Linux는 명백히 다르다.

Linux를 기반으로 만든 것일 뿐 Android에 필요한 기능들로 수정되고 추가되어 있다.

비유하자면

- Linux는 엔진,
- Ubuntu나 Fedora는 일반 자동차,
- Android는 그 엔진을 활용해 만든 전기 스쿠터

Android 운영체제의 가장 큰 특징은 운영체제단의 핵심 코드를 오픈소스로 공개해놓은 것이다.

이를 AOSP 라고 부르는데 (Android Open Source Project) 대략적으로 아래와 같이 구성돼있다.

| **Linux 커널** | 안드로이드용으로 수정된 Linux 커널 소스 |
| --- | --- |
| **Android Runtime (ART)** | 앱(Java/Kotlin)을 실행하는 가상 머신 |
| **Framework** | 앱이 사용할 수 있는 시스템 API (예: 카메라, 위치 등) |
| **System Apps** | 전화, 메시지, 설정, 런처 등 기본 앱의 오픈소스 버전 |
| **Build System** | 전체 Android를 빌드하기 위한 도구 (Make/Bazel 기반) |
| **HAL (Hardware Abstraction Layer)** | 하드웨어 제조사들이 구현해야 하는 인터페이스 계층 |
| **Native C/C++ Libraries** | OpenGL, WebKit, libc 등 네이티브 라이브러리 |

AOSP의 특징

- 누구나 소스코드를 내려받고 빌드, 수정, 재배포 가능
- 커스텀 Android OS 개발의 기반 (예: 삼성 One UI, 커스텀 롬)
- Git 저장소로 관리됨 (android.googlesource.com)

AOSP에 없는 것들

- AOSP에는 Google 앱(Gmail, Play Store, Maps 등)이 포함되어 있지 않습니다.
- Google Mobile Services (GMS)도 **비공개 라이선스**에 속하며, **AOSP에 포함되지 않음**.
- 그래서 AOSP만 가지고 만든 Android OS는 Play 스토어가 없습니다.

## 동작 원리

## 관련 개념

## 참고자료

- [Tistory 원문](https://myinfosub.tistory.com/9)
