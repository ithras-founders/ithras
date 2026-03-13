"""RBAC models: Role, Permission, RolePermission, UserRoleAssignment"""
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Table, UniqueConstraint
from sqlalchemy.orm import relationship
from ..database import Base
import datetime


role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", String, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", String, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
)


class Role(Base):
    __tablename__ = "roles"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False, default="PREDEFINED")  # PREDEFINED | CUSTOM
    description = Column(String, nullable=True)
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=True)
    is_system = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles", lazy="selectin")
    institution = relationship("Institution", foreign_keys=[institution_id])


class Permission(Base):
    __tablename__ = "permissions"
    id = Column(String, primary_key=True)
    code = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    description = Column(String, nullable=True)

    roles = relationship("Role", secondary=role_permissions, back_populates="permissions", lazy="selectin")


class UserRoleAssignment(Base):
    __tablename__ = "user_role_assignments"
    __table_args__ = (
        UniqueConstraint("user_id", "role_id", "institution_id", "company_id", "program_id", name="uq_user_role_context"),
    )

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role_id = Column(String, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True)
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=True)
    program_id = Column(String, ForeignKey("programs.id"), nullable=True)
    granted_by = Column(String, ForeignKey("users.id"), nullable=True)
    granted_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)

    user = relationship("User", foreign_keys=[user_id], backref="role_assignments")
    role = relationship("Role", foreign_keys=[role_id], lazy="selectin")
    institution = relationship("Institution", foreign_keys=[institution_id])
    company = relationship("Company", foreign_keys=[company_id])
    program = relationship("Program", foreign_keys=[program_id])
    granter = relationship("User", foreign_keys=[granted_by])
