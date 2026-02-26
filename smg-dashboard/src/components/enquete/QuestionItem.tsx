'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Trash2 } from 'lucide-react';
import { css } from '../../../styled-system/css';
import { type QuestionItem as QuestionItemType, QuestionType } from './types';

interface QuestionItemProps {
  question: QuestionItemType;
  updateQuestionTitle: (id: string, title: string) => void;
  updateOption: (
    questionId: string,
    optionIndex: number,
    value: string,
  ) => void;
  addOption: (questionId: string) => void;
  deleteOption: (questionId: string, optionIndex: number) => void;
  toggleRequired: (id: string) => void;
  deleteQuestion: (id: string) => void;
}

export function QuestionItem({
  question,
  updateQuestionTitle,
  updateOption,
  addOption,
  deleteOption,
  toggleRequired,
  deleteQuestion,
}: QuestionItemProps) {
  return (
    <div
      className={css({
        position: 'relative',
        border: '1px solid',
        borderColor: 'gray.200',
        borderRadius: 'md',
        padding: { base: '4', md: '6' },
        bg: 'white',
        boxShadow: 'sm',
        _hover: {
          boxShadow: 'md',
        },
        marginBottom: '2',
      })}
    >
      <div
        className={css({
          display: 'flex',
          alignItems: 'start',
          gap: { base: '2', md: '4' },
          flexDirection: { base: 'column', md: 'row' },
        })}
      >
        <div className={css({ flex: '1', width: 'full' })}>
          <Input
            value={question.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateQuestionTitle(question.id, e.target.value)
            }
            className={css({
              fontSize: { base: 'md', md: 'lg' },
              fontWeight: 'medium',
              border: 'none',
              outline: 'none',
              padding: '0',
              marginBottom: '4',
              width: 'full',
              _focus: { ring: '0' },
            })}
          />

          {question.type === QuestionType.MultipleChoice &&
            question.options && (
              <div
                className={css({
                  marginTop: '2',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2',
                  width: 'full',
                })}
              >
                {question.options.map((option, index) => (
                  <div
                    key={`${question.id}-${option}`}
                    className={css({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2',
                      width: 'full',
                    })}
                  >
                    <div
                      className={css({
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '5',
                        height: '5',
                        flexShrink: '0',
                        border: '1px solid',
                        borderColor: 'gray.300',
                        borderRadius: 'full',
                      })}
                    >
                      <div
                        className={css({
                          width: '3',
                          height: '3',
                          bg: 'white',
                          borderRadius: 'full',
                        })}
                      />
                    </div>
                    <Input
                      value={option}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateOption(question.id, index, e.target.value)
                      }
                      className={css({
                        border: 'none',
                        outline: 'none',
                        padding: '0',
                        flex: '1',
                        minWidth: '0',
                        _focus: { ring: '0' },
                      })}
                    />
                    <Button
                      onClick={() => deleteOption(question.id, index)}
                      className={css({
                        padding: '1',
                        minWidth: 'auto',
                        height: 'auto',
                        bg: 'transparent',
                        color: 'gray.500',
                        _hover: { bg: 'gray.100' },
                        opacity: '100',
                        transition: 'opacity 0.2s',
                        cursor: 'pointer',
                        flexShrink: '0',
                      })}
                    >
                      <Trash2 className={css({ width: '4', height: '4' })} />
                    </Button>
                  </div>
                ))}
                <div className={css({ paddingLeft: { base: '2', md: '6' } })}>
                  <Button
                    onClick={() => addOption(question.id)}
                    className={css({
                      fontSize: 'sm',
                      fontWeight: 'normal',
                      bg: 'transparent',
                      color: 'gray.600',
                      padding: '0',
                      height: 'auto',
                      _hover: { bg: 'transparent', color: 'gray.900' },
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2',
                    })}
                  >
                    <PlusCircle className={css({ width: '4', height: '4' })} />
                    選択肢を追加
                  </Button>
                </div>
              </div>
            )}

          {question.type === QuestionType.ShortAnswer && (
            <div
              className={css({
                marginTop: '2',
                borderBottom: '1px solid',
                borderColor: 'gray.300',
                width: 'full',
                height: '8',
              })}
            />
          )}

          <div
            className={css({
              display: 'flex',
              alignItems: 'center',
              gap: '2',
              marginTop: '4',
              justifyContent: 'space-between',
              flexDirection: { base: 'row', md: 'row' },
              width: 'full',
            })}
          >
            <div
              className={css({
                display: { base: 'flex', md: 'none' },
              })}
            >
              <Button
                onClick={() => deleteQuestion(question.id)}
                className={css({
                  padding: '2',
                  minWidth: 'auto',
                  height: 'auto',
                  bg: 'transparent',
                  color: 'gray.500',
                  _hover: { bg: 'gray.100' },
                  cursor: 'pointer',
                })}
              >
                <Trash2 className={css({ width: '4', height: '4' })} />
              </Button>
            </div>

            <label
              htmlFor={`question-${question.id}`}
              className={css({
                display: 'flex',
                alignItems: 'center',
                gap: '2',
                cursor: 'pointer',
                marginLeft: { base: 'auto', md: '0' },
              })}
            >
              <span
                className={css({
                  fontSize: 'sm',
                  color: 'gray.600',
                })}
              >
                必須
              </span>
              <div
                onClick={() => toggleRequired(question.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    toggleRequired(question.id);
                  }
                }}
                role="switch"
                aria-checked={question.required}
                tabIndex={0}
                className={css({
                  position: 'relative',
                  width: '10',
                  height: '5',
                  backgroundColor: question.required ? '#254860' : '#e2e8f0',
                  borderRadius: 'full',
                  transition: 'background-color 0.2s',
                  cursor: 'pointer',
                })}
              >
                <div
                  className={css({
                    position: 'absolute',
                    left: question.required ? '5' : '0',
                    top: '0',
                    width: '5',
                    height: '5',
                    backgroundColor: 'white',
                    borderRadius: 'full',
                    transition: 'left 0.2s',
                    boxShadow: 'sm',
                  })}
                />
              </div>
            </label>
          </div>
        </div>

        <div
          className={css({
            display: { base: 'none', md: 'flex' },
            flexDirection: 'column',
            gap: '2',
          })}
        >
          <Button
            onClick={() => deleteQuestion(question.id)}
            className={css({
              padding: '2',
              minWidth: 'auto',
              height: 'auto',
              bg: 'transparent',
              color: 'gray.500',
              _hover: { bg: 'gray.100' },
              cursor: 'pointer',
            })}
          >
            <Trash2 className={css({ width: '4', height: '4' })} />
          </Button>
        </div>
      </div>
    </div>
  );
}
