import { cite } from '@urbit/api';
import React, { HTMLAttributes } from 'react';
import { useContact } from '../state/contact';

type ShipNameProps = {
  name: string;
  showAlias?: boolean;
} & HTMLAttributes<HTMLSpanElement>;

export default function ShipName({
  name,
  showAlias = false,
  ...props
}: ShipNameProps) {
  const contact = useContact(name);
  const separator = /([_^-])/;
  const citedName = cite(name);

  if (!citedName) {
    return null;
  }

  const parts = citedName.replace('~', '').split(separator);
  const first = parts.shift();

  return (
    <span {...props}>
      {contact?.nickname && showAlias ? (
        <span title={citedName}>{contact.nickname}</span>
      ) : (
        <>
          <span aria-hidden>~</span>
          <span>{first}</span>
          {parts.length > 1 && (
            <>
              {parts.map((piece, index) => (
                <span
                  key={`${piece}-${index}`}
                  aria-hidden={separator.test(piece)}
                >
                  {piece}
                </span>
              ))}
            </>
          )}
        </>
      )}
    </span>
  );
}
