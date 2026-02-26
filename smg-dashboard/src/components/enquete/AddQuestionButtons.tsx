'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { css } from '../../../styled-system/css';
import { QuestionType } from './types';

interface AddQuestionButtonsProps {
  addQuestion: (type: QuestionType) => void;
}

export function AddQuestionButtons({ addQuestion }: AddQuestionButtonsProps) {
  return (
    <div
      className={css({
        display: 'flex',
        flexDirection: { base: 'column', md: 'row' },
        justifyContent: 'center',
        gap: '4',
        margin: { base: '4 0', md: '8 0' },
        padding: { base: '3', md: '4' },
        border: '2px dashed',
        borderColor: 'gray.200',
        borderRadius: 'lg',
        transition: 'all 0.2s',
        _hover: {
          borderColor: '#3a6b85',
          bg: '#eef5f9',
        },
      })}
    >
      <Button
        onClick={() => addQuestion(QuestionType.MultipleChoice)}
        className={css({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2',
          padding: { base: '3', md: '4' },
          width: { base: 'full', md: '48' },
          height: { base: '24', md: '32' },
          bg: 'white',
          color: 'gray.700',
          border: '1px solid',
          borderColor: 'gray.200',
          borderRadius: 'lg',
          _hover: {
            bg: '#eef5f9',
            borderColor: '#3a6b85',
            transform: 'translateY(-2px)',
          },
          transition: 'all 0.2s',
          cursor: 'pointer',
        })}
      >
        <div
          className={css({
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: { base: '8', md: '10' },
            height: { base: '8', md: '10' },
            bg: '#d7e5ed',
            borderRadius: 'full',
          })}
        >
          <PlusCircle
            className={css({
              width: { base: '5', md: '6' },
              height: { base: '5', md: '6' },
              color: '#254860',
            })}
          />
        </div>
        <span className={css({ fontSize: 'sm', fontWeight: 'medium' })}>
          選択式の質問
        </span>
      </Button>
      <Button
        onClick={() => addQuestion(QuestionType.ShortAnswer)}
        className={css({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2',
          padding: { base: '3', md: '4' },
          width: { base: 'full', md: '48' },
          height: { base: '24', md: '32' },
          bg: 'white',
          color: 'gray.700',
          border: '1px solid',
          borderColor: 'gray.200',
          borderRadius: 'lg',
          _hover: {
            bg: '#eef5f9',
            borderColor: '#3a6b85',
            transform: 'translateY(-2px)',
          },
          transition: 'all 0.2s',
          cursor: 'pointer',
        })}
      >
        <div
          className={css({
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: { base: '8', md: '10' },
            height: { base: '8', md: '10' },
            bg: '#d7e5ed',
            borderRadius: 'full',
          })}
        >
          <PlusCircle
            className={css({
              width: { base: '5', md: '6' },
              height: { base: '5', md: '6' },
              color: '#254860',
            })}
          />
        </div>
        <span className={css({ fontSize: 'sm', fontWeight: 'medium' })}>
          記述式の質問
        </span>
      </Button>
    </div>
  );
}
