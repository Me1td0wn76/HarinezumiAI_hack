/**
 * useActionState と組み合わせて使う Server Function の戻り値。
 * 初期状態（まだ送信していない）は undefined。
 */
export type ActionState =
  | {
      error?: string;
      success?: boolean;
    }
  | undefined;
