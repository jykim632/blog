---
title: unknown을 좁히고 discriminated union으로 상태를 모델링할 수 있는가?
summary: 개발 공부 시리즈
publishedAt: 2026-07-16
category: STUDY
tags:
  - movement
  - typescript
draft: false
---

다음을 생각했을 때 이 질문에 대한 답을 생각해볼 수 있을 것 같다.

1. 외부 입력(API 응답, 웹훅, `catch` 오류 등)을 신뢰하지 않고 검증을 하는가?
1. 비동기 요청의 UI 상태를 모순 없이 설계하는가
1. Typescript를 단순 타입 표기가 아니라 버그 예방 도구로 쓰는가..

왜?에 대한 이야기를 쓰고싶지만 먼저 답변과 정리부터 진행한다.


### unknown 타입은 무엇일까
  

  이 타입은 **값의 타입을 아직 알 수 없을 때 쓰는 안전한 타입**이고, 어떤 값이든 담을 수 있음.

```typescript
let value: unknown;
```
하지만 무엇이 들어있는지 확실하지 않으므로, 확인하기 전에는 바로 사용을 못함
```typescript
value.toUpperCase();
// error: value가 문자열인지 알 수 없음
```
사용하려면 타입을 좁혀야 함
```typescript
if (typeof value === "string") {
  console.log(value.toUpperCase());
}
```

객체라면 null 여부와 속성 구조까지 확인해야 함.
```typescript

type value = {
  id: number;
  name: string;
}

function isUser(value: unknown): value {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const user = value as Record<string, unknown>;

  return (
    typeof user.id === "number" &&
    typeof user.name === "string"
  );
}

const data: unknown = {
  id: 1,
  name: "민지",
};

if (isUser(data)) {
  console.log(data.name.toUpperCase());
}
```
`isUser`가 `true`를 반환한 블록에서는 data가 `{ id: number; name: string; }`으로 안전하게 좁혀짐.
  
unknown은 특히 외부에서 들어오는 데이터에 적합한데,
* JSON.parse() 결과
* localStorage에서 읽은 값
* postMessage 데이터
* 사용자 입력
* catch (error)의 오류 값
* 타입 정의가 부정확하거나 없는 외부 라이브러리 값
  
왜냐면 말 그대로 알 수 없는 값들이기 때문이다.
  
이들을 any로 받게 된다면 타입검사가 없어도 지나가기 때문에 컴파일 타임에 에러를 확인할 수 없고, unknown을 통해 타입검사를 시키고 받는 것이 더 안전하기 때문이다.
  
하지만 타입스크립트는 컴파일 후 사라진다. 그래서 unknown으로 일단 데이터를 받은 뒤, 타입 가드나 zod같은 스키마 검증으로 구조를 확인까지 진행해야한다.

</details>

  
### discriminated union 은 무엇일까

Typescript의 **union type + 타입 좁히기** 기능을 활용하는 방식

```typescript
type UserPageState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; users: User[] }
  | { status: "error"; message: string };
```
이런 타입이 있을 때, `UserPageState`는 `status`를 통해 상태를 파악할 수 있다. 이 때 `status`는 '판별자'로 부른다.

Typescript는 `status`를 통해, 타입을 안전하게 좁힐 수 있다.

```typescript
function render(state: UserPageState) {
  if (state.status === "success") {
    state.users;   // User[]
    state.message; // 오류: success 상태에는 없음
  }

  if (state.status === "error") {
    state.message; // string
    state.users;   // 오류: error 상태에는 없음
  }
}
```
이게 중요한 이유는 **불가능한 상태**를 모델에서 제거하기 때문.

아래 예를 보자.
```typescript
// 애매하고 모순된 상태를 만들 수 있음
type BadState = {
  loading: boolean;
  users?: User[];
  error?: string;
};

const state: BadState = {
  loading: true,
  users: [],
  error: "네트워크 오류",
};
```
**loading중인데도 users가 빈 배열로 들어오고, 에러도 값이 들어옴**
-> 이게 허용되는 게 의도인지, 버그인지 타입만 보고 판단하기가 어려움

그래서 이 discriminated union을 사용하여, 허용된 상태의 타입을 만들어 사용하는것이다.

```typescript
// API 처리 결과
type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: "UNAUTHORIZED" | "NOT_FOUND"; message: string };

// 결제 상태
type PaymentState =
  | { status: "pending" }
  | { status: "approved"; transactionId: string }
  | { status: "failed"; reason: string }
  | { status: "cancelled"; cancelledAt: string };
```
switch를 통해 모든 상태를 빠뜨리지 않게 만들 수도 있음.
```typescript
function assertNever(value: never): never {
  throw new Error(`처리되지 않은 상태: ${JSON.stringify(value)}`);
}

function render(state: UserPageState) {
  switch (state.status) {
    case "idle":
      return "대기";
    case "loading":
      return "로딩";
    case "success":
      return `${state.users.length}명`;
    case "error":
      return state.message;
    default:
      return assertNever(state);
  }
}
```
switch를 사용한 예를 추가한 이유는, 추후에 상태가 추가되었을 때 빠진 분기를 컴파일 단계에서 발견할 수 있기 때문에 추가로 넣어놨다.

그렇다고 무조건 모든 상태를 disciriminated union으로 만들 필요는 없고, 서로 배타적이거나, 상태마다 필요한 데이터가 달라지는 경우에 한해서 쓰면 좋을듯하다.

---

react가 사용되면서 프론트엔드에서 '상태'는 굉장히 중요한 부분이다. 상태만 잘 모델링하면 사용자에게 헷갈리는 화면을 제공하지 않을 수 있고, 팀 내부에 혼동이 생기지도 않을 수 있다.

---

어쨋든 이 질문은, 프론트엔드 개발자로서 화면과 데이터의 불확실성을 **안전**한게 다룰 수 있는지에 대한 질문으로 볼 수 있다.

1. 프론트엔드에서는 지속적으로 `API응답`, `사용자 입력`같은 '_신뢰할 수 없는 데이터_'를 어떻게 검증하고 안전하게 사용할 수 있는지를 `unknown`을 사용해서 처리할 수 있는지.

1. `로딩`, `성공`, `빈 결과`, `오류` 같은 화면 상태를 모순 없이 설계하고 UX 요구사항을 코드에 정확히 반영하기 위해 discriminated union을 사용해 상태를 모델링할 수 있는가를 보는 것.
  
  
---
  
개발할 때 자연스럽게 생각하는 부분이긴 했지만, 이렇게 정리를 해본적은 없었다. 실은 되는대로 했기 때문에..
  
개발을 하다보면 자연스럽게 경험하게되는 부분이 아닌가 싶다. 지금은 AI가 대부분 코딩을 해주고 있긴 하지만, 기본적인 부분이다보니 많은 공부가 되었다. 결국 이런 지식이 AI한테 명령하는데 있어 좋은 배경지식이 될 것 같다.
  
  게을리 하지 말아야지.
  
더 나아가서는 '이런 흐름을 어느 시점에 적용하는게 좋을까?'라는 생각도 들었다. 왜냐면 화면기획이 되고나서는 이 흐름이 적용되기에는 화면 기획을 다시해야할 것 같다는 생각도 들었기 때문이다.
  
화면 기획 전 기능 설계 단계에서 이 부분이 고민될 것 같다.

`unknown`쪽은 코드상의 문제이니 개발자가 진행할 것이고, discriminated union을 기획/UX, UI 설계 회의를 할 때 아래처럼 이야기가 진행되어야 할 것 같다.
  
**사용자 목록을 보여주기** 기능 요구사항이 나오면
  * 처음 진입시 : 스켈레톤을 보여줄까, 빈화면을 보여줄까?
  * 데이터가 없을 때 : 어떤 문구와 행동 버튼을 보여줄까?
  * 불러오기에 실패했을 때 : 재시도 버튼이 필요한가?
  * 필터 결과가 없을 때: 전체 데이터 없음과 다르게 보일까?
  * 목록을 새로고침할 때 : 기존 목록을 유지한 채 작은 로딩 표시를 할까?

흐름도를 만들 수도 있을 것 같다.
  
이런 고민을 통해 결론적으로는 화면별 상태를 정리해놓으면, discriminated union을 바로 모델링할 수 있을 것이다.
  
| 화면 | 상태 | 사용자에게 보이는 것 | 가능한 행동 |
|---|---|---|---|
| 사용자 목록 | 로딩 | 스켈레톤 | 없음 |
| 사용자 목록 | 성공 | 목록 | 상세 보기, 새로고침 |
| 사용자 목록 | 비어 있음 | 빈 상태 안내 | 사용자 추가 |
| 사용자 목록 | 오류 | 오류 안내 | 다시 시도 |
  
UX, 디자인, 프론트엔드, 백엔드가 같은 상황일 때 소통이 편할 것이기도 하고.
  
이런 부분도 정말 잘 해봐야지 앞으로는.