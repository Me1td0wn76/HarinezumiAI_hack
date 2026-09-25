import { startTransition, type FormEvent } from "react";

/**
 * React 19 の <form action={...}> は送信のたびに入力欄をリセットする（エラーが返っても）。
 * ハンドルの重複のように直して送り直すことが多いフォームは、onSubmit で送信を引き取って入力を残す。
 * action 属性も併せて渡しておけば、JavaScript が動く前・無効な環境では通常のフォーム送信になる
 * @param dispatch useActionState が返す action
 */
export function keepValuesOnSubmit(dispatch: (formData: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => dispatch(formData));
  };
}
