"""Added default rating to Restaurant model

Revision ID: 3b2988303522
Revises: 086f68922a40
Create Date: 2025-02-01 04:50:28.243453

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3b2988303522'
down_revision = '086f68922a40'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('restaurant', schema=None) as batch_op:
        batch_op.add_column(sa.Column('rating', sa.Integer(), nullable=False, server_default="0"))  # ✅ Setting a default value


    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('restaurant', schema=None) as batch_op:
        batch_op.drop_column('rating')

    # ### end Alembic commands ###
