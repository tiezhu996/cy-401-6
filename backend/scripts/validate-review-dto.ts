import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateReviewDto } from '../src/modules/review/dto/create-review.dto';

const VALID_CONTRACT_ID = '123e4567-e89b-12d3-a456-426614174000';
const VALID_REVIEWEE_ID = '123e4567-e89b-12d3-a456-426614174001';

interface TestCase {
    name: string;
    input: Record<string, unknown>;
    expect: {
        valid: boolean;
        commentErrors?: number;
        commentTransformed?: unknown;
    };
}

const testCases: TestCase[] = [
    {
        name: '空字符串 comment: "" → 归一化为 undefined，无错误',
        input: {
            contractId: VALID_CONTRACT_ID,
            revieweeId: VALID_REVIEWEE_ID,
            score: 5,
            comment: ''
        },
        expect: {
            valid: true,
            commentErrors: 0,
            commentTransformed: undefined
        }
    },
    {
        name: '纯空白 comment: "   " → 归一化为 undefined，无错误',
        input: {
            contractId: VALID_CONTRACT_ID,
            revieweeId: VALID_REVIEWEE_ID,
            score: 5,
            comment: '   '
        },
        expect: {
            valid: true,
            commentErrors: 0,
            commentTransformed: undefined
        }
    },
    {
        name: '正常字符串 comment: "做得很好" → 保留，无错误',
        input: {
            contractId: VALID_CONTRACT_ID,
            revieweeId: VALID_REVIEWEE_ID,
            score: 5,
            comment: '做得很好'
        },
        expect: {
            valid: true,
            commentErrors: 0,
            commentTransformed: '做得很好'
        }
    },
    {
        name: '非法类型 comment: 123 → @IsString 报错，验证失败',
        input: {
            contractId: VALID_CONTRACT_ID,
            revieweeId: VALID_REVIEWEE_ID,
            score: 5,
            comment: 123
        },
        expect: {
            valid: false,
            commentErrors: 1,
            commentTransformed: 123
        }
    },
    {
        name: '对象类型 comment: { foo: 1 } → @IsString 报错，验证失败',
        input: {
            contractId: VALID_CONTRACT_ID,
            revieweeId: VALID_REVIEWEE_ID,
            score: 5,
            comment: { foo: 1 }
        },
        expect: {
            valid: false,
            commentErrors: 1
        }
    },
    {
        name: '数组类型 comment: ["a"] → @IsString 报错，验证失败',
        input: {
            contractId: VALID_CONTRACT_ID,
            revieweeId: VALID_REVIEWEE_ID,
            score: 5,
            comment: ['a']
        },
        expect: {
            valid: false,
            commentErrors: 1
        }
    },
    {
        name: '布尔类型 comment: true → @IsString 报错，验证失败',
        input: {
            contractId: VALID_CONTRACT_ID,
            revieweeId: VALID_REVIEWEE_ID,
            score: 5,
            comment: true
        },
        expect: {
            valid: false,
            commentErrors: 1
        }
    },
    {
        name: 'null comment → @IsOptional 跳过，无错误',
        input: {
            contractId: VALID_CONTRACT_ID,
            revieweeId: VALID_REVIEWEE_ID,
            score: 5,
            comment: null
        },
        expect: {
            valid: true,
            commentErrors: 0,
            commentTransformed: null
        }
    },
    {
        name: 'undefined comment → @IsOptional 跳过，无错误',
        input: {
            contractId: VALID_CONTRACT_ID,
            revieweeId: VALID_REVIEWEE_ID,
            score: 5,
            comment: undefined
        },
        expect: {
            valid: true,
            commentErrors: 0,
            commentTransformed: undefined
        }
    },
    {
        name: '带前后空白的字符串 comment: "  不错  " → trim 后保留，无错误',
        input: {
            contractId: VALID_CONTRACT_ID,
            revieweeId: VALID_REVIEWEE_ID,
            score: 5,
            comment: '  不错  '
        },
        expect: {
            valid: true,
            commentErrors: 0,
            commentTransformed: '不错'
        }
    }
];

async function runTests() {
    console.log('========================================');
    console.log('  CreateReviewDto 校验测试');
    console.log('========================================\n');

    let passed = 0;
    let failed = 0;

    for (const testCase of testCases) {
        console.log(`测试: ${testCase.name}`);

        const dto = plainToInstance(CreateReviewDto, testCase.input);
        const errors = await validate(dto, { whitelist: true });

        const commentErrors = errors.filter(e => e.property === 'comment');
        const isValid = errors.length === 0;
        const actualComment = dto.comment;

        const commentOk = testCase.expect.commentErrors === undefined
            ? true
            : commentErrors.length === testCase.expect.commentErrors;
        const validOk = isValid === testCase.expect.valid;
        const transformOk = testCase.expect.commentTransformed === undefined
            ? true
            : actualComment === testCase.expect.commentTransformed;

        const testPassed = commentOk && validOk && transformOk;

        if (testPassed) {
            console.log(`  ✅ 通过`);
            console.log(`     - 验证结果: ${isValid ? '有效' : '无效'}`);
            console.log(`     - comment 转换后: ${JSON.stringify(actualComment)}`);
            if (commentErrors.length > 0) {
                console.log(`     - comment 错误: ${commentErrors.map(e => Object.values(e.constraints || {})).join(', ')}`);
            }
            passed++;
        } else {
            console.log(`  ❌ 失败`);
            console.log(`     - 期望 验证结果: ${testCase.expect.valid ? '有效' : '无效'}`);
            console.log(`     - 实际 验证结果: ${isValid ? '有效' : '无效'}`);
            console.log(`     - 期望 comment 转换后: ${JSON.stringify(testCase.expect.commentTransformed)}`);
            console.log(`     - 实际 comment 转换后: ${JSON.stringify(actualComment)}`);
            console.log(`     - 期望 comment 错误数: ${testCase.expect.commentErrors ?? '不检查'}`);
            console.log(`     - 实际 comment 错误数: ${commentErrors.length}`);
            if (commentErrors.length > 0) {
                console.log(`     - comment 错误详情: ${commentErrors.map(e => JSON.stringify(e.constraints)).join(', ')}`);
            }
            if (errors.length > 0) {
                console.log(`     - 全部错误: ${errors.map(e => `${e.property}: ${JSON.stringify(e.constraints)}`).join(' | ')}`);
            }
            failed++;
        }
        console.log('');
    }

    console.log('========================================');
    console.log(`  结果: ${passed} 通过, ${failed} 失败`);
    console.log('========================================');

    process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
    console.error('测试执行失败:', err);
    process.exit(1);
});
