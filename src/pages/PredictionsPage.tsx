import { Sparkles } from 'lucide-react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { Button, EmptyState, Page, PageHeader, Panel } from '@/components/ui'

const PredictionsPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <Page width="narrow">
      <PageHeader title={t('stocks.predictions')} subtitle={t('picks.subtitle')} />
      <Panel flush>
        <EmptyState
          icon={<Sparkles className="h-4 w-4" />}
          title={t('stocks.predictions')}
          description={t('picks.subtitle')}
          action={
            <Button onClick={() => navigate('/')} leftIcon={<Sparkles className="h-4 w-4" />}>
              {t('picks.title')}
            </Button>
          }
        />
      </Panel>
    </Page>
  )
}

export default PredictionsPage
