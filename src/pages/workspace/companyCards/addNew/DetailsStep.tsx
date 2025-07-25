import React, {useCallback} from 'react';
import {View} from 'react-native';
import FormProvider from '@components/Form/FormProvider';
import InputWrapper from '@components/Form/InputWrapper';
import type {FormInputErrors, FormOnyxValues} from '@components/Form/types';
import HeaderWithBackButton from '@components/HeaderWithBackButton';
import Icon from '@components/Icon';
import * as Expensicons from '@components/Icon/Expensicons';
import ScreenWrapper from '@components/ScreenWrapper';
import Text from '@components/Text';
import TextInput from '@components/TextInput';
import TextLink from '@components/TextLink';
import useAutoFocusInput from '@hooks/useAutoFocusInput';
import useCardFeeds from '@hooks/useCardFeeds';
import useEnvironment from '@hooks/useEnvironment';
import useLocalize from '@hooks/useLocalize';
import useOnyx from '@hooks/useOnyx';
import useTheme from '@hooks/useTheme';
import useThemeStyles from '@hooks/useThemeStyles';
import {getFieldRequiredErrors} from '@libs/ValidationUtils';
import Navigation from '@navigation/Navigation';
import variables from '@styles/variables';
import {addNewCompanyCardsFeed, setAddNewCompanyCardStepAndData} from '@userActions/CompanyCards';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import INPUT_IDS from '@src/types/form/AddNewCardFeedForm';

type DetailsStepProps = {
    /** ID of the current policy */
    policyID: string | undefined;
};

function DetailsStep({policyID}: DetailsStepProps) {
    const {translate} = useLocalize();
    const theme = useTheme();
    const styles = useThemeStyles();
    const {inputCallbackRef} = useAutoFocusInput();
    const {isDevelopment} = useEnvironment();

    const [addNewCard] = useOnyx(ONYXKEYS.ADD_NEW_COMPANY_CARD, {canBeMissing: false});
    const [lastSelectedFeed] = useOnyx(`${ONYXKEYS.COLLECTION.LAST_SELECTED_FEED}${policyID}`, {canBeMissing: true});

    const [cardFeeds] = useCardFeeds(policyID);

    const feedProvider = addNewCard?.data?.feedType;
    const isStripeFeedProvider = feedProvider === CONST.COMPANY_CARD.FEED_BANK_NAME.STRIPE;
    const bank = addNewCard?.data?.selectedBank;
    const isOtherBankSelected = bank === CONST.COMPANY_CARDS.BANKS.OTHER;

    // s77rt remove DEV lock
    const shouldSelectStatementCloseDate = isDevelopment;

    const submit = (values: FormOnyxValues<typeof ONYXKEYS.FORMS.ADD_NEW_CARD_FEED_FORM>) => {
        if (!addNewCard?.data) {
            return;
        }

        const feedDetails = {
            ...values,
            bankName: addNewCard.data.bankName ?? 'Amex',
        };

        if (shouldSelectStatementCloseDate) {
            setAddNewCompanyCardStepAndData({step: CONST.COMPANY_CARDS.STEP.SELECT_STATEMENT_CLOSE_DATE, data: {feedDetails}});
            return;
        }

        addNewCompanyCardsFeed(policyID, addNewCard.data.feedType, feedDetails, cardFeeds, lastSelectedFeed);
        Navigation.goBack(ROUTES.WORKSPACE_COMPANY_CARDS.getRoute(policyID));
    };

    const handleBackButtonPress = () => {
        if (isOtherBankSelected) {
            setAddNewCompanyCardStepAndData({step: CONST.COMPANY_CARDS.STEP.CARD_NAME});
            return;
        }
        setAddNewCompanyCardStepAndData({step: CONST.COMPANY_CARDS.STEP.CARD_INSTRUCTIONS});
    };

    const validate = useCallback(
        (values: FormOnyxValues<typeof ONYXKEYS.FORMS.ADD_NEW_CARD_FEED_FORM>): FormInputErrors<typeof ONYXKEYS.FORMS.ADD_NEW_CARD_FEED_FORM> => {
            const errors = getFieldRequiredErrors(values, [INPUT_IDS.BANK_ID]);

            switch (feedProvider) {
                case CONST.COMPANY_CARD.FEED_BANK_NAME.VISA:
                    if (!values[INPUT_IDS.BANK_ID]) {
                        errors[INPUT_IDS.BANK_ID] = translate('common.error.fieldRequired');
                    } else if (values[INPUT_IDS.BANK_ID].length > CONST.STANDARD_LENGTH_LIMIT) {
                        errors[INPUT_IDS.BANK_ID] = translate('common.error.characterLimitExceedCounter', {
                            length: values[INPUT_IDS.BANK_ID].length,
                            limit: CONST.STANDARD_LENGTH_LIMIT,
                        });
                    }
                    if (!values[INPUT_IDS.PROCESSOR_ID]) {
                        errors[INPUT_IDS.PROCESSOR_ID] = translate('common.error.fieldRequired');
                    } else if (values[INPUT_IDS.PROCESSOR_ID].length > CONST.STANDARD_LENGTH_LIMIT) {
                        errors[INPUT_IDS.PROCESSOR_ID] = translate('common.error.characterLimitExceedCounter', {
                            length: values[INPUT_IDS.PROCESSOR_ID].length,
                            limit: CONST.STANDARD_LENGTH_LIMIT,
                        });
                    }
                    if (!values[INPUT_IDS.COMPANY_ID]) {
                        errors[INPUT_IDS.COMPANY_ID] = translate('common.error.fieldRequired');
                    } else if (values[INPUT_IDS.COMPANY_ID].length > CONST.STANDARD_LENGTH_LIMIT) {
                        errors[INPUT_IDS.COMPANY_ID] = translate('common.error.characterLimitExceedCounter', {
                            length: values[INPUT_IDS.COMPANY_ID].length,
                            limit: CONST.STANDARD_LENGTH_LIMIT,
                        });
                    }
                    break;
                case CONST.COMPANY_CARD.FEED_BANK_NAME.MASTER_CARD:
                    if (!values[INPUT_IDS.DISTRIBUTION_ID]) {
                        errors[INPUT_IDS.DISTRIBUTION_ID] = translate('common.error.fieldRequired');
                    } else if (values[INPUT_IDS.DISTRIBUTION_ID].length > CONST.STANDARD_LENGTH_LIMIT) {
                        errors[INPUT_IDS.DISTRIBUTION_ID] = translate('common.error.characterLimitExceedCounter', {
                            length: values[INPUT_IDS.DISTRIBUTION_ID].length,
                            limit: CONST.STANDARD_LENGTH_LIMIT,
                        });
                    }
                    break;
                case CONST.COMPANY_CARD.FEED_BANK_NAME.AMEX:
                    if (!values[INPUT_IDS.DELIVERY_FILE_NAME]) {
                        errors[INPUT_IDS.DELIVERY_FILE_NAME] = translate('common.error.fieldRequired');
                    } else if (values[INPUT_IDS.DELIVERY_FILE_NAME].length > CONST.STANDARD_LENGTH_LIMIT) {
                        errors[INPUT_IDS.DELIVERY_FILE_NAME] = translate('common.error.characterLimitExceedCounter', {
                            length: values[INPUT_IDS.DELIVERY_FILE_NAME].length,
                            limit: CONST.STANDARD_LENGTH_LIMIT,
                        });
                    }
                    break;
                default:
                    break;
            }
            return errors;
        },
        [feedProvider, translate],
    );

    const renderInputs = () => {
        switch (feedProvider) {
            case CONST.COMPANY_CARD.FEED_BANK_NAME.VISA:
                return (
                    <>
                        <InputWrapper
                            InputComponent={TextInput}
                            inputID={INPUT_IDS.PROCESSOR_ID}
                            label={translate('workspace.companyCards.addNewCard.feedDetails.vcf.processorLabel')}
                            role={CONST.ROLE.PRESENTATION}
                            containerStyles={[styles.mb6]}
                            ref={inputCallbackRef}
                            defaultValue={addNewCard?.data.feedDetails?.processorID}
                        />
                        <InputWrapper
                            InputComponent={TextInput}
                            inputID={INPUT_IDS.BANK_ID}
                            label={translate('workspace.companyCards.addNewCard.feedDetails.vcf.bankLabel')}
                            role={CONST.ROLE.PRESENTATION}
                            containerStyles={[styles.mb6]}
                            defaultValue={addNewCard?.data.feedDetails?.bankID}
                        />
                        <InputWrapper
                            InputComponent={TextInput}
                            inputID={INPUT_IDS.COMPANY_ID}
                            label={translate('workspace.companyCards.addNewCard.feedDetails.vcf.companyLabel')}
                            role={CONST.ROLE.PRESENTATION}
                            containerStyles={[styles.mb6]}
                            defaultValue={addNewCard?.data.feedDetails?.companyID}
                        />
                    </>
                );
            case CONST.COMPANY_CARD.FEED_BANK_NAME.MASTER_CARD:
                return (
                    <InputWrapper
                        InputComponent={TextInput}
                        inputID={INPUT_IDS.DISTRIBUTION_ID}
                        label={translate('workspace.companyCards.addNewCard.feedDetails.cdf.distributionLabel')}
                        role={CONST.ROLE.PRESENTATION}
                        containerStyles={[styles.mb6]}
                        ref={inputCallbackRef}
                        defaultValue={addNewCard?.data.feedDetails?.distributionID}
                    />
                );
            case CONST.COMPANY_CARD.FEED_BANK_NAME.AMEX:
                return (
                    <InputWrapper
                        InputComponent={TextInput}
                        inputID={INPUT_IDS.DELIVERY_FILE_NAME}
                        label={translate('workspace.companyCards.addNewCard.feedDetails.gl1025.fileNameLabel')}
                        role={CONST.ROLE.PRESENTATION}
                        containerStyles={[styles.mb6]}
                        ref={inputCallbackRef}
                        defaultValue={addNewCard?.data.feedDetails?.deliveryFileName}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <ScreenWrapper
            testID={DetailsStep.displayName}
            enableEdgeToEdgeBottomSafeAreaPadding
            shouldEnablePickerAvoiding={false}
            shouldEnableMaxHeight
        >
            <HeaderWithBackButton
                title={translate('workspace.companyCards.addCards')}
                onBackButtonPress={handleBackButtonPress}
            />
            <FormProvider
                formID={ONYXKEYS.FORMS.ADD_NEW_CARD_FEED_FORM}
                submitButtonText={shouldSelectStatementCloseDate ? translate('common.next') : translate('common.submit')}
                onSubmit={submit}
                validate={validate}
                style={[styles.mh5, styles.flexGrow1]}
                shouldHideFixErrorsAlert={feedProvider !== CONST.COMPANY_CARD.FEED_BANK_NAME.VISA}
                addBottomSafeAreaPadding
            >
                <Text style={[styles.textHeadlineLineHeightXXL, styles.mv3]}>
                    {!!feedProvider && !isStripeFeedProvider ? translate(`workspace.companyCards.addNewCard.feedDetails.${feedProvider}.title`) : ''}
                </Text>
                {renderInputs()}
                {!!feedProvider && !isStripeFeedProvider && (
                    <View style={[styles.flexRow, styles.alignItemsCenter]}>
                        <Icon
                            src={Expensicons.QuestionMark}
                            width={variables.iconSizeExtraSmall}
                            height={variables.iconSizeExtraSmall}
                            fill={theme.icon}
                        />
                        <TextLink
                            style={[styles.label, styles.textLineHeightNormal, styles.ml2]}
                            href={CONST.COMPANY_CARDS_DELIVERY_FILE_HELP[feedProvider]}
                        >
                            {translate(`workspace.companyCards.addNewCard.feedDetails.${feedProvider}.helpLabel`)}
                        </TextLink>
                    </View>
                )}
            </FormProvider>
        </ScreenWrapper>
    );
}

DetailsStep.displayName = 'DetailsStep';

export default DetailsStep;
