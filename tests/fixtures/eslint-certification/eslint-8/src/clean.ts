interface Message {
  text: string;
}

export const message: Message = { text: 'clean' };

export const acceptMessage = (_ignored: Message): void => {};
